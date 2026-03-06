from django.contrib.auth.hashers import make_password
from django.db import migrations


def seed_auth_users(apps, schema_editor):
    User = apps.get_model('auth', 'User')

    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@example.com',
            'is_staff': True,
            'is_superuser': True,
            'is_active': True,
            'first_name': 'Admin',
            'last_name': 'User',
        },
    )
    if created:
        admin_user.password = make_password('admin123')
        admin_user.save(update_fields=['password'])

    staff_user, created = User.objects.get_or_create(
        username='staff',
        defaults={
            'email': 'staff@example.com',
            'is_staff': False,
            'is_superuser': False,
            'is_active': True,
            'first_name': 'Staff',
            'last_name': 'User',
        },
    )
    if created:
        staff_user.password = make_password('staff123')
        staff_user.save(update_fields=['password'])


def unseed_auth_users(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    User.objects.filter(username__in=['admin', 'staff']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_seed_default_stores'),
    ]

    operations = [
        migrations.RunPython(seed_auth_users, unseed_auth_users),
    ]
