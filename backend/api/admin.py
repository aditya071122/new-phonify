from django.contrib import admin
from .models import (
    Buyback,
    Customer,
    Employee,
    Product,
    RepairTicket,
    Sale,
    SaleItem,
    Store,
    StoreInventory,
)

admin.site.register(Store)
admin.site.register(Customer)
admin.site.register(Employee)
admin.site.register(Product)
admin.site.register(StoreInventory)
admin.site.register(Sale)
admin.site.register(SaleItem)
admin.site.register(Buyback)
admin.site.register(RepairTicket)
