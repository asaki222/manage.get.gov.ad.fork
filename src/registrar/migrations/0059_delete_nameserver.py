# Generated by Django 4.2.7 on 2023-12-21 11:07

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("registrar", "0058_alter_domaininformation_options"),
    ]

    operations = [
        migrations.DeleteModel(
            name="Nameserver",
        ),
    ]
