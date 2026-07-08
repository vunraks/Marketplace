using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using VaultTrade.Infrastructure.Data;

#nullable disable

namespace VaultTrade.Infrastructure.Data.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260708000000_AddCheckoutWalletAndStock")]
    public partial class AddCheckoutWalletAndStock : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "StockQuantity",
                table: "listings",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<decimal>(
                name: "VirtualBalance",
                table: "users",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 100000m);

            migrationBuilder.AddColumn<int>(
                name: "Quantity",
                table: "orders",
                type: "integer",
                nullable: false,
                defaultValue: 1);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StockQuantity",
                table: "listings");

            migrationBuilder.DropColumn(
                name: "VirtualBalance",
                table: "users");

            migrationBuilder.DropColumn(
                name: "Quantity",
                table: "orders");
        }
    }
}
