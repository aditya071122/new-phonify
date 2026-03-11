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

from .models import Buyback, Customer, Employee, Expense, PaymentEntry, Product, RepairTicket, Sale, SaleItem, Store, StoreInventory
from .serializers import (
    BuybackSerializer,
    CustomerSerializer,
    EmployeeSerializer,
    ExpenseSerializer,
    PaymentEntrySerializer,
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


def is_manager_user(user):
    return bool(
        user
        and user.is_authenticated
        and hasattr(user, 'employee_profile')
        and user.employee_profile
        and user.employee_profile.role == 'Manager'
    )


class IsAdminOrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_superuser or is_manager_user(user)))


class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all().order_by('id')
    serializer_class = StoreSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return super().get_permissions()


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
            return [IsAdminOrManager()]
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

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return super().get_permissions()


class StoreInventoryViewSet(viewsets.ModelViewSet):
    queryset = StoreInventory.objects.select_related('store_ref', 'product').all().order_by('-id')
    serializer_class = StoreInventorySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        store_id = self.request.query_params.get('store')
        if store_id:
            queryset = queryset.filter(store_ref_id=store_id)
        return queryset


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-expense_date', '-id')
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        store_id = self.request.query_params.get('store')
        if store_id:
            queryset = queryset.filter(store_ref_id=store_id)
        return queryset

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return super().get_permissions()


class PaymentEntryViewSet(viewsets.ModelViewSet):
    queryset = PaymentEntry.objects.all().order_by('-entry_date', '-id')
    serializer_class = PaymentEntrySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        store_id = self.request.query_params.get('store')
        if store_id:
            queryset = queryset.filter(store_ref_id=store_id)
        entry_type = self.request.query_params.get('entry_type')
        if entry_type:
            queryset = queryset.filter(entry_type=entry_type)
        return queryset

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrManager()]
        return super().get_permissions()


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

    if user.is_superuser:
        role = 'Admin'
    elif is_manager_user(user):
        role = 'Manager'
    else:
        role = 'Staff'

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
@permission_classes([IsAdminOrManager])
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
    expenses_qs = Expense.objects.filter(expense_date__range=(start_date, end_date))
    payments_qs = PaymentEntry.objects.filter(entry_date__range=(start_date, end_date))

    if store_id:
        sales_qs = sales_qs.filter(store_ref_id=store_id)
        buybacks_qs = buybacks_qs.filter(store_ref_id=store_id)
        repairs_qs = repairs_qs.filter(store_ref_id=store_id)
        customers_qs = customers_qs.filter(store_ref_id=store_id)
        expenses_qs = expenses_qs.filter(store_ref_id=store_id)
        payments_qs = payments_qs.filter(store_ref_id=store_id)

    sales = list(sales_qs)
    total_sales_amount = sum(float(sale.total_amount or 0) for sale in sales)
    sales_count = len(sales)
    avg_order_value = (total_sales_amount / sales_count) if sales_count else 0.0

    total_buyback_cost = float(buybacks_qs.aggregate(total=Sum('negotiated_price'))['total'] or 0)
    total_repair_revenue = float(repairs_qs.aggregate(total=Sum('labor_cost'))['total'] or 0)
    total_expense_out = float(expenses_qs.aggregate(total=Sum('out_cash'))['total'] or 0) + float(expenses_qs.aggregate(total=Sum('out_online'))['total'] or 0)
    total_payment_in = float(payments_qs.filter(entry_type='in').aggregate(total=Sum('cash_amount'))['total'] or 0) + float(payments_qs.filter(entry_type='in').aggregate(total=Sum('online_amount'))['total'] or 0)
    total_payment_out = float(payments_qs.filter(entry_type='out').aggregate(total=Sum('cash_amount'))['total'] or 0) + float(payments_qs.filter(entry_type='out').aggregate(total=Sum('online_amount'))['total'] or 0)

    top_selling = list(
        SaleItem.objects.filter(sale__in=sales_qs)
        .values('product__name')
        .annotate(total_qty=Sum('quantity'))
        .order_by('-total_qty')[:5]
    )
    top_products_text = '; '.join([f"{row['product__name']} ({row['total_qty']})" for row in top_selling]) or '-'

    section = (request.query_params.get('section') or 'overall').strip().lower()

    csv_buffer = StringIO()
    writer = csv.writer(csv_buffer)

    if section == 'sales':
        writer.writerow(['SL NO', 'JOB NO', 'CUSTOMER NAME', 'MOBILE MODEL', 'IC', 'CASH', 'ONLINE', 'EX AMOUNT', 'EX MODEL', 'TOTAL', 'GOT', 'GIFT', 'SALESMAN', 'SOLD AT'])
        for idx, sale in enumerate(sales, start=1):
            model_names = '; '.join([item.product.name for item in sale.items.all()]) or '-'
            writer.writerow([
                idx,
                sale.job_no or sale.id,
                sale.customer.name if sale.customer else 'Walk-in',
                model_names,
                sale.ic_number,
                f'{float(sale.cash_amount or 0):.2f}',
                f'{float(sale.online_amount or 0):.2f}',
                f'{float(sale.exchange_amount or 0):.2f}',
                sale.exchange_model,
                f'{float(sale.total_amount or 0):.2f}',
                f'{float(sale.got_amount or 0):.2f}',
                sale.gift,
                sale.salesperson_name or (sale.salesperson.name if sale.salesperson else ''),
                sale.sold_at.isoformat(),
            ])
    elif section == 'accessories':
        writer.writerow(['SL NO', 'JOB NO', 'CUSTOMER NAME', 'A.TYPE', 'IC', 'GIFT', 'CASH', 'ONLINE', 'GOT', 'SALESMAN'])
        accessory_sales = [sale for sale in sales if any(item.product.category == 'accessories' for item in sale.items.all())]
        for idx, sale in enumerate(accessory_sales, start=1):
            accessory_names = '; '.join([item.product.name for item in sale.items.all() if item.product.category == 'accessories']) or '-'
            writer.writerow([
                idx,
                sale.job_no or sale.id,
                sale.customer.name if sale.customer else 'Walk-in',
                accessory_names,
                sale.ic_number,
                sale.gift,
                f'{float(sale.cash_amount or 0):.2f}',
                f'{float(sale.online_amount or 0):.2f}',
                f'{float(sale.got_amount or 0):.2f}',
                sale.salesperson_name or (sale.salesperson.name if sale.salesperson else ''),
            ])
    elif section == 'buybacks':
        writer.writerow(['SL NO', 'JOB NO', 'CUSTOMER NAME', 'MOBILE MODEL', 'IC', 'CASH', 'ONLINE', 'EX AMOUNT', 'EX MODEL', 'TOTAL', 'STATUS'])
        for idx, buyback in enumerate(buybacks_qs, start=1):
            writer.writerow([
                idx,
                buyback.job_no or buyback.id,
                buyback.customer.name if buyback.customer else 'Walk-in',
                f'{buyback.brand} {buyback.model}'.strip(),
                buyback.ic_number,
                f'{float(buyback.cash_amount or 0):.2f}',
                f'{float(buyback.online_amount or 0):.2f}',
                f'{float(buyback.exchange_amount or 0):.2f}',
                buyback.exchange_model,
                f'{float(buyback.negotiated_price or 0):.2f}',
                buyback.status,
            ])
    elif section == 'repairs':
        writer.writerow(['SL NO', 'CS/STORE', 'MOBILE MODEL', 'PROBLEM', 'SERVICE MAN', 'PARTS CHARGES', 'SERVICE CHARGES', 'GOT', 'IN CASH', 'IN ONLINE', 'OUT CASH', 'OUT ONLINE', 'STATUS'])
        for idx, repair in enumerate(repairs_qs, start=1):
            writer.writerow([
                idx,
                repair.store_ref.name if repair.store_ref else '',
                repair.device_model,
                repair.problem,
                repair.technician_name,
                f'{float(repair.parts_charge or 0):.2f}',
                f'{float(repair.labor_cost or 0):.2f}',
                f'{float(repair.got_amount or 0):.2f}',
                f'{float(repair.in_cash or 0):.2f}',
                f'{float(repair.in_online or 0):.2f}',
                f'{float(repair.out_cash or 0):.2f}',
                f'{float(repair.out_online or 0):.2f}',
                repair.status,
            ])
    elif section == 'expenses':
        writer.writerow(['SL NO', 'REASON', 'OUT CASH', 'OUT ONLINE', 'DATE'])
        for idx, expense in enumerate(expenses_qs, start=1):
            writer.writerow([idx, expense.reason, f'{float(expense.out_cash or 0):.2f}', f'{float(expense.out_online or 0):.2f}', expense.expense_date.isoformat()])
    elif section == 'payments':
        writer.writerow(['SL NO', 'DEALER NAME', 'IN CASH', 'IN ONLINE', 'OUT CASH', 'OUT ONLINE', 'DATE'])
        for idx, payment in enumerate(payments_qs, start=1):
            writer.writerow([
                idx,
                payment.dealer_name,
                f'{float(payment.cash_amount or 0):.2f}' if payment.entry_type == 'in' else '0.00',
                f'{float(payment.online_amount or 0):.2f}' if payment.entry_type == 'in' else '0.00',
                f'{float(payment.cash_amount or 0):.2f}' if payment.entry_type == 'out' else '0.00',
                f'{float(payment.online_amount or 0):.2f}' if payment.entry_type == 'out' else '0.00',
                payment.entry_date.isoformat(),
            ])
    elif section == 'inventory':
        inventory_qs = Product.objects.all().order_by('name')
        if store_id:
            inventory_qs = inventory_qs.filter(store_inventory__store_ref_id=store_id).distinct()
        writer.writerow(['SL NO', 'SKU', 'PRODUCT NAME', 'CATEGORY', 'PRICE', 'STOCK'])
        for idx, product in enumerate(inventory_qs, start=1):
            writer.writerow([idx, product.sku, product.name, product.category, f'{float(product.price or 0):.2f}', product.stock_quantity])
    elif section == 'customers':
        writer.writerow(['SL NO', 'CUSTOMER NAME', 'PHONE', 'EMAIL', 'CREATED AT'])
        for idx, customer in enumerate(customers_qs, start=1):
            writer.writerow([idx, customer.name, customer.phone, customer.email, customer.created_at.isoformat()])
    else:
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
        writer.writerow(['Expense Out', f'{total_expense_out:.2f}'])
        writer.writerow(['Pending In', f'{total_payment_in:.2f}'])
        writer.writerow(['Payments Out', f'{total_payment_out:.2f}'])
        writer.writerow(['New Customers', customers_qs.count()])
        writer.writerow(['Pending Repairs', repairs_qs.exclude(status='Delivered').count()])
        writer.writerow(['Pending Buybacks', buybacks_qs.filter(status='Pending').count()])
        writer.writerow(['Top Selling Products', top_products_text])

    response = HttpResponse(csv_buffer.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{section}_report_{start_date}_{end_date}.csv"'
    return response
