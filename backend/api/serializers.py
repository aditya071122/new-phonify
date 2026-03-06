from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Buyback, Customer, Employee, Product, RepairTicket, Sale, SaleItem, Store, StoreInventory


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


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


class StoreInventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreInventory
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
        fields = ['id', 'customer', 'store_ref', 'salesperson', 'sold_at', 'notes', 'items', 'total_amount']
        read_only_fields = ['sold_at', 'total_amount']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        sale = Sale.objects.create(**validated_data)
        for item in items_data:
            SaleItem.objects.create(sale=sale, **item)
        return sale

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                SaleItem.objects.create(sale=instance, **item)

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
