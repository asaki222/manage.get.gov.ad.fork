# Generated by Django 4.2.10 on 2024-09-26 15:09

from django.db import migrations, models
import django.db.models.deletion
import registrar.models.federal_agency


class Migration(migrations.Migration):

    dependencies = [
        ("registrar", "0129_create_groups_v17"),
    ]

    operations = [
        migrations.AlterField(
            model_name="portfolio",
            name="federal_agency",
            field=models.ForeignKey(
                default=registrar.models.federal_agency.FederalAgency.get_non_federal_agency,
                on_delete=django.db.models.deletion.PROTECT,
                to="registrar.federalagency",
            ),
        ),
        migrations.AlterField(
            model_name="portfolio",
            name="organization_name",
            field=models.CharField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="portfolio",
            name="organization_type",
            field=models.CharField(
                blank=True,
                choices=[
                    ("federal", "Federal"),
                    ("interstate", "Interstate"),
                    ("state_or_territory", "State or territory"),
                    ("tribal", "Tribal"),
                    ("county", "County"),
                    ("city", "City"),
                    ("special_district", "Special district"),
                    ("school_district", "School district"),
                ],
                max_length=255,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="portfolio",
            name="senior_official",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="portfolios",
                to="registrar.seniorofficial",
            ),
        ),
    ]
