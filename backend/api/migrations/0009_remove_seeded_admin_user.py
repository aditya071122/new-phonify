from django.db import migrations


def remove_seeded_admin_user(apps, schema_editor):
    user_model = apps.get_model('auth', 'User')
    user_model.objects.filter(username='admin').delete()


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0008_employee_auth_user'),
    ]

    operations = [
        migrations.RunPython(remove_seeded_admin_user, migrations.RunPython.noop),
    ]
