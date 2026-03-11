from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from .models import Buyback, Customer, Employee, Expense, PaymentEntry, Product, RepairTicket, Sale, SaleItem, Store, StoreInventory


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = '__all__'


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'


class EmployeeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True, required=False, allow_blank=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=False, style={'input_type': 'password'})
    login_username = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ['auth_user']

    def get_login_username(self, obj):
        return obj.auth_user.username if obj.auth_user else ''

    def create(self, validated_data):
        username = validated_data.pop('username', '').strip()
        password = validated_data.pop('password', '')

        if username or password:
            if not username or not password:
                raise serializers.ValidationError({'detail': 'Both username and password are required for employee login.'})

            user_model = get_user_model()
            if user_model.objects.filter(username=username).exists():
                raise serializers.ValidationError({'username': 'This username is already taken.'})

            user = user_model.objects.create_user(
                username=username,
                password=password,
                email=validated_data.get('email', ''),
                first_name=validated_data.get('name', ''),
                is_staff=False,
                is_superuser=False,
            )
            validated_data['auth_user'] = user

        return super().create(validated_data)

    def update(self, instance, validated_data):
        username = validated_data.pop('username', '').strip() if 'username' in validated_data else None
        password = validated_data.pop('password', None)
        user_model = get_user_model()
        auth_user = instance.auth_user

        if username:
            existing = user_model.objects.filter(username=username)
            if auth_user:
                existing = existing.exclude(pk=auth_user.pk)
            if existing.exists():
                raise serializers.ValidationError({'username': 'This username is already taken.'})

        if (username or password) and auth_user is None:
            if not username or not password:
                raise serializers.ValidationError({'detail': 'Both username and password are required to create employee login.'})

            auth_user = user_model.objects.create_user(
                username=username,
                password=password,
                email=validated_data.get('email', instance.email),
                first_name=validated_data.get('name', instance.name),
                is_staff=False,
                is_superuser=False,
            )
            instance.auth_user = auth_user

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if auth_user:
            if username:
                auth_user.username = username
            if password:
                auth_user.set_password(password)
            auth_user.email = instance.email
            auth_user.first_name = instance.name
            auth_user.save()

        return instance


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


class StoreInventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreInventory
        fields = '__all__'


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'


class PaymentEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentEntry
        fields = '__all__'


class SaleItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'quantity', 'unit_price', 'line_total']


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id',
            'customer',
            'store_ref',
            'salesperson',
            'job_no',
            'ic_number',
            'cash_amount',
            'online_amount',
            'exchange_amount',
            'exchange_model',
            'got_amount',
            'gift',
            'salesperson_name',
            'sold_at',
            'notes',
            'items',
            'total_amount',
        ]
        read_only_fields = ['sold_at', 'total_amount']

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError('At least one sale item is required.')

        for item in items:
            product = item['product']
            quantity = item['quantity']
            if quantity < 1:
                raise serializers.ValidationError(f'Quantity must be at least 1 for {product.name}.')
            if product.category != 'services' and quantity > product.stock_quantity:
                raise serializers.ValidationError(f'Insufficient stock for {product.name}. Available: {product.stock_quantity}.')
        return items

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        sale = Sale.objects.create(**validated_data)
        for item in items_data:
            product = item['product']
            quantity = item['quantity']
            SaleItem.objects.create(sale=sale, **item)
            if product.category != 'services':
                product.stock_quantity -= quantity
                product.save(update_fields=['stock_quantity'])
        return sale

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            for existing_item in instance.items.select_related('product').all():
                if existing_item.product.category != 'services':
                    existing_item.product.stock_quantity += existing_item.quantity
                    existing_item.product.save(update_fields=['stock_quantity'])
            instance.items.all().delete()
            for item in items_data:
                product = item['product']
                quantity = item['quantity']
                if product.category != 'services' and quantity > product.stock_quantity:
                    raise serializers.ValidationError({'items': f'Insufficient stock for {product.name}. Available: {product.stock_quantity}.'})
                SaleItem.objects.create(sale=instance, **item)
                if product.category != 'services':
                    product.stock_quantity -= quantity
                    product.save(update_fields=['stock_quantity'])

        return instance


class BuybackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Buyback
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class RepairTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairTicket
        fields = '__all__'
        read_only_fields = ['id', 'created_at']
