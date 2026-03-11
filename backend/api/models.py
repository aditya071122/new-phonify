from django.conf import settings
from django.db import models


class Store(models.Model):
    STORE_TYPE_CHOICES = [
        ('main', 'Main Branch'),
        ('addon', 'Addon Branch'),
    ]

    name = models.CharField(max_length=120, unique=True)
    code = models.CharField(max_length=30, unique=True)
    store_type = models.CharField(max_length=10, choices=STORE_TYPE_CHOICES, default='addon')
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='children')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Customer(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    store_ref = models.ForeignKey(Store, null=True, blank=True, on_delete=models.SET_NULL, related_name='customers')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Employee(models.Model):
    ROLE_CHOICES = [
        ('Manager', 'Manager'),
        ('Salesman', 'Salesman'),
        ('Technician', 'Technician'),
        ('Staff', 'Staff'),
    ]

    name = models.CharField(max_length=120)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Staff')
    store = models.CharField(max_length=120, blank=True)
    store_ref = models.ForeignKey(Store, null=True, blank=True, on_delete=models.SET_NULL, related_name='employees')
    auth_user = models.OneToOneField(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='employee_profile')
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    sales_count = models.PositiveIntegerField(default=0)
    join_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    CATEGORY_CHOICES = [
        ('new_phone', 'New Phone'),
        ('used_phone', 'Used Phone'),
        ('accessories', 'Accessories'),
        ('services', 'Services'),
    ]

    sku = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='new_phone')
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    primary_store_ref = models.ForeignKey(Store, null=True, blank=True, on_delete=models.SET_NULL, related_name='primary_products')
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.sku} - {self.name}"


class StoreInventory(models.Model):
    store_ref = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='inventory_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='store_inventory')
    quantity = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('store_ref', 'product')

    def __str__(self):
        return f"{self.store_ref.name} - {self.product.sku} ({self.quantity})"


class Sale(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales')
    store_ref = models.ForeignKey(Store, null=True, blank=True, on_delete=models.SET_NULL, related_name='sales')
    salesperson = models.ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL, related_name='sales')
    job_no = models.CharField(max_length=40, blank=True)
    ic_number = models.CharField(max_length=60, blank=True)
    cash_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    online_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    exchange_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    exchange_model = models.CharField(max_length=150, blank=True)
    got_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gift = models.CharField(max_length=150, blank=True)
    salesperson_name = models.CharField(max_length=120, blank=True)
    sold_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    @property
    def total_amount(self):
        return sum(item.line_total for item in self.items.all())


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='sale_items')
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def line_total(self):
        return self.quantity * self.unit_price


class Buyback(models.Model):
    CONDITION_CHOICES = [
        ('Excellent', 'Excellent'),
        ('Good', 'Good'),
        ('Fair', 'Fair'),
        ('Poor', 'Poor'),
    ]

    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Accepted', 'Accepted'),
        ('Processed', 'Processed'),
        ('Rejected', 'Rejected'),
    ]

    imei = models.CharField(max_length=15, unique=True)
    brand = models.CharField(max_length=80, blank=True)
    model = models.CharField(max_length=120, blank=True)
    color = models.CharField(max_length=50, blank=True)
    customer = models.ForeignKey(Customer, null=True, blank=True, on_delete=models.SET_NULL, related_name='buybacks')
    store_ref = models.ForeignKey(Store, null=True, blank=True, on_delete=models.SET_NULL, related_name='buybacks')
    job_no = models.CharField(max_length=40, blank=True)
    ic_number = models.CharField(max_length=60, blank=True)
    cash_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    online_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    exchange_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    exchange_model = models.CharField(max_length=150, blank=True)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='Good')
    market_value = models.DecimalField(max_digits=10, decimal_places=2)
    negotiated_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.imei} - {self.brand} {self.model}".strip()


class RepairTicket(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Delivered', 'Delivered'),
    ]

    WARRANTY_CHOICES = [
        ('3 months', '3 months'),
        ('6 months', '6 months'),
        ('12 months', '12 months'),
    ]

    ticket_no = models.CharField(max_length=24, unique=True)
    customer_name = models.CharField(max_length=120)
    customer = models.ForeignKey(Customer, null=True, blank=True, on_delete=models.SET_NULL, related_name='repair_tickets')
    store_ref = models.ForeignKey(Store, null=True, blank=True, on_delete=models.SET_NULL, related_name='repair_tickets')
    device_model = models.CharField(max_length=150)
    problem = models.TextField(blank=True)
    technician_name = models.CharField(max_length=120, blank=True)
    technician = models.ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL, related_name='repair_tickets')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    parts = models.JSONField(default=list, blank=True)
    parts_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    labor_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    got_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    in_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    in_online = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    out_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    out_online = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    warranty = models.CharField(max_length=20, choices=WARRANTY_CHOICES, default='3 months')
    estimated_completion = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.ticket_no


class Expense(models.Model):
    store_ref = models.ForeignKey(Store, null=True, blank=True, on_delete=models.SET_NULL, related_name='expenses')
    reason = models.CharField(max_length=180)
    out_cash = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    out_online = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    expense_date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.reason


class PaymentEntry(models.Model):
    ENTRY_TYPE_CHOICES = [
        ('in', 'Pending In'),
        ('out', 'Payments Out'),
    ]

    store_ref = models.ForeignKey(Store, null=True, blank=True, on_delete=models.SET_NULL, related_name='payment_entries')
    entry_type = models.CharField(max_length=10, choices=ENTRY_TYPE_CHOICES)
    dealer_name = models.CharField(max_length=180)
    cash_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    online_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    entry_date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.entry_type}: {self.dealer_name}'
