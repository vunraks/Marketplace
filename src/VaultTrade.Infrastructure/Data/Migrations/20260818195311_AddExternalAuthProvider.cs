using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VaultTrade.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalAuthProvider : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExternalProvider",
                table: "users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalProviderUserId",
                table: "users",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_ExternalProvider_ExternalProviderUserId",
                table: "users",
                columns: new[] { "ExternalProvider", "ExternalProviderUserId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_ExternalProvider_ExternalProviderUserId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ExternalProvider",
                table: "users");

            migrationBuilder.DropColumn(
                name: "ExternalProviderUserId",
                table: "users");
        }
    }
}
