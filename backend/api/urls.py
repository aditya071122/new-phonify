from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BuybackViewSet,
    CustomerViewSet,
    EmployeeViewSet,
    ProductViewSet,
    RepairTicketViewSet,
    SaleViewSet,
    StoreInventoryViewSet,
    StoreViewSet,
    auth_login,
    auth_logout,
    health_check,
    report_brief_download,
)

router = DefaultRouter()
router.register(r'stores', StoreViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'products', ProductViewSet)
router.register(r'store-inventory', StoreInventoryViewSet)
router.register(r'sales', SaleViewSet)
router.register(r'buybacks', BuybackViewSet)
router.register(r'repairs', RepairTicketViewSet)

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('auth/login/', auth_login, name='auth-login'),
    path('auth/logout/', auth_logout, name='auth-logout'),
    path('reports/brief/download/', report_brief_download, name='report-brief-download'),
    path('', include(router.urls)),
]
