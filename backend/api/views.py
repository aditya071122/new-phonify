import calendar
import csv
from datetime import datetime, timedelta
from io import StringIO

from django.contrib.auth import authenticate
from django.db.models import Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Buyback, Customer, Employee, Product, RepairTicket, Sale, SaleItem, Store, StoreInventory
from .serializers import (
    BuybackSerializer,
    CustomerSerializer,
    EmployeeSerializer,
    ProductSerializer,
    RepairTicketSerializer,
    SaleSerializer,
    StoreInventorySerializer,
    StoreSerializer,
)


def apply_store_filter(queryset, request):
    store_id = request.query_params.get('store')
    if store_id:
        return queryset.filter(store_ref_id=store_id)
    return queryset


class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all().order_by('id')
    serializer_class = StoreSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-id')
    serializer_class = CustomerSerializer

    def get_queryset(self):
        return apply_store_filter(super().get_queryset(), self.request)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by('-id')
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    def get_queryset(self):
        return apply_store_filter(super().get_queryset(), self.request)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-id')
    serializer_class = ProductSerializer

    def get_queryset(self):
        store_id = self.request.query_params.get('store')
        queryset = super().get_queryset()
        if store_id:
            return queryset.filter(store_inventory__store_ref_id=store_id).distinct()
        return queryset


class StoreInventoryViewSet(viewsets.ModelViewSet):
    queryset = StoreInventory.objects.select_related('store_ref', 'product').all().order_by('-id')
    serializer_class = StoreInventorySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        store_id = self.request.query_params.get('store')
        if store_id:
            queryset = queryset.filter(store_ref_id=store_id)
        return queryset


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.prefetch_related('items').all().order_by('-id')
    serializer_class = SaleSerializer

    def get_queryset(self):
        return apply_store_filter(super().get_queryset(), self.request)


class BuybackViewSet(viewsets.ModelViewSet):
    queryset = Buyback.objects.all().order_by('-id')
    serializer_class = BuybackSerializer

    def get_queryset(self):
        return apply_store_filter(super().get_queryset(), self.request)


class RepairTicketViewSet(viewsets.ModelViewSet):
    queryset = RepairTicket.objects.all().order_by('-id')
    serializer_class = RepairTicketSerializer

    def get_queryset(self):
        return apply_store_filter(super().get_queryset(), self.request)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(_request):
    return Response({'status': 'ok'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def auth_login(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    if not username or not password:
        return Response({'detail': 'Username and password are required.'}, status=400)

    user = authenticate(username=username, password=password)
    if user is None:
        return Response({'detail': 'Invalid credentials.'}, status=401)

    role = 'Admin' if user.is_superuser else 'Staff'

    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'user': {
            'id': str(user.id),
            'name': user.get_full_name() or user.username,
            'email': user.email or '',
            'role': role,
            'createdAt': user.date_joined.isoformat(),
        }
    })


@api_view(['POST'])
def auth_logout(request):
    if request.auth:
        request.auth.delete()
    return Response({'detail': 'Logged out.'})


def _resolve_report_range(request):
    month = (request.query_params.get('month') or '').strip()
    from_date_raw = (request.query_params.get('from') or '').strip()
    to_date_raw = (request.query_params.get('to') or '').strip()

    if month:
        year, month_num = [int(part) for part in month.split('-')]
        first_day = datetime(year, month_num, 1).date()
        last_day = datetime(year, month_num, calendar.monthrange(year, month_num)[1]).date()
        return first_day, last_day

    if from_date_raw and to_date_raw:
        start = datetime.strptime(from_date_raw, '%Y-%m-%d').date()
        end = datetime.strptime(to_date_raw, '%Y-%m-%d').date()
        return start, end

    today = timezone.localdate()
    return today - timedelta(days=29), today


@api_view(['GET'])
@permission_classes([permissions.IsAdminUser])
def report_brief_download(request):
    try:
        start_date, end_date = _resolve_report_range(request)
    except (ValueError, TypeError):
        return Response({'detail': 'Invalid date format. Use month=YYYY-MM or from/to=YYYY-MM-DD.'}, status=400)

    if end_date < start_date:
        return Response({'detail': 'End date must be on or after start date.'}, status=400)

    store_id = request.query_params.get('store')

    sales_qs = Sale.objects.filter(sold_at__date__range=(start_date, end_date)).prefetch_related('items')
    buybacks_qs = Buyback.objects.filter(created_at__date__range=(start_date, end_date))
    repairs_qs = RepairTicket.objects.filter(created_at__date__range=(start_date, end_date))
    customers_qs = Customer.objects.filter(created_at__date__range=(start_date, end_date))

    if store_id:
        sales_qs = sales_qs.filter(store_ref_id=store_id)
        buybacks_qs = buybacks_qs.filter(store_ref_id=store_id)
        repairs_qs = repairs_qs.filter(store_ref_id=store_id)
        customers_qs = customers_qs.filter(store_ref_id=store_id)

    sales = list(sales_qs)
    total_sales_amount = sum(float(sale.total_amount or 0) for sale in sales)
    sales_count = len(sales)
    avg_order_value = (total_sales_amount / sales_count) if sales_count else 0.0

    total_buyback_cost = float(buybacks_qs.aggregate(total=Sum('negotiated_price'))['total'] or 0)
    total_repair_revenue = float(repairs_qs.aggregate(total=Sum('labor_cost'))['total'] or 0)

    top_selling = list(
        SaleItem.objects.filter(sale__in=sales_qs)
        .values('product__name')
        .annotate(total_qty=Sum('quantity'))
        .order_by('-total_qty')[:5]
    )
    top_products_text = '; '.join([f"{row['product__name']} ({row['total_qty']})" for row in top_selling]) or '-'

    csv_buffer = StringIO()
    writer = csv.writer(csv_buffer)
    writer.writerow(['Metric', 'Value'])
    writer.writerow(['From Date', start_date.isoformat()])
    writer.writerow(['To Date', end_date.isoformat()])
    writer.writerow(['Store Filter', store_id or 'All Stores'])
    writer.writerow(['Sales Count', sales_count])
    writer.writerow(['Sales Revenue', f'{total_sales_amount:.2f}'])
    writer.writerow(['Average Order Value', f'{avg_order_value:.2f}'])
    writer.writerow(['Buybacks Count', buybacks_qs.count()])
    writer.writerow(['Buyback Cost', f'{total_buyback_cost:.2f}'])
    writer.writerow(['Repairs Count', repairs_qs.count()])
    writer.writerow(['Repair Revenue', f'{total_repair_revenue:.2f}'])
    writer.writerow(['New Customers', customers_qs.count()])
    writer.writerow(['Pending Repairs', repairs_qs.exclude(status='Delivered').count()])
    writer.writerow(['Pending Buybacks', buybacks_qs.filter(status='Pending').count()])
    writer.writerow(['Top Selling Products', top_products_text])

    response = HttpResponse(csv_buffer.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="brief_report_{start_date}_{end_date}.csv"'
    return response
