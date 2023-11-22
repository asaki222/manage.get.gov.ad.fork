# Generated by Django 4.2.7 on 2023-11-22 20:47

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("registrar", "0048_alter_contact_middle_name_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="domainapplication",
            name="urbanization",
            field=models.TextField(blank=True, help_text="Urbanization (required for Puerto Rico only)", null=True),
        ),
        migrations.AlterField(
            model_name="domaininformation",
            name="urbanization",
            field=models.TextField(
                blank=True,
                help_text="Urbanization (required for Puerto Rico only)",
                null=True,
                verbose_name="Urbanization (required for Puerto Rico only)",
            ),
        ),
    ]
