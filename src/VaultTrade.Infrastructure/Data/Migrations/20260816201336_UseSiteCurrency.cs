using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VaultTrade.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UseSiteCurrency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "listings"
                SET "Currency" = 'VT'
                WHERE "Currency" = 'RUB';
                """);

            migrationBuilder.Sql("""
                UPDATE "orders"
                SET "Currency" = 'VT'
                WHERE "Currency" = 'RUB';
                """);

            migrationBuilder.AlterColumn<string>(
                name: "Currency",
                table: "listings",
                type: "character varying(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "VT",
                oldClrType: typeof(string),
                oldType: "character varying(3)",
                oldMaxLength: 3,
                oldDefaultValue: "RUB");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "listings"
                SET "Currency" = 'RUB'
                WHERE "Currency" = 'VT';
                """);

            migrationBuilder.Sql("""
                UPDATE "orders"
                SET "Currency" = 'RUB'
                WHERE "Currency" = 'VT';
                """);

            migrationBuilder.AlterColumn<string>(
                name: "Currency",
                table: "listings",
                type: "character varying(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "RUB",
                oldClrType: typeof(string),
                oldType: "character varying(3)",
                oldMaxLength: 3,
                oldDefaultValue: "VT");
        }
    }
}
