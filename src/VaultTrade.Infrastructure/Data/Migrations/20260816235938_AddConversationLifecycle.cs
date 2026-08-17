using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VaultTrade.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddConversationLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ClosedAt",
                table: "Conversations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ClosedById",
                table: "Conversations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsClosed",
                table: "Conversations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "OpenedAt",
                table: "Conversations",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.Sql("""
                UPDATE "Conversations"
                SET "OpenedAt" = "CreatedAt";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_ClosedById",
                table: "Conversations",
                column: "ClosedById");

            migrationBuilder.AddForeignKey(
                name: "FK_Conversations_users_ClosedById",
                table: "Conversations",
                column: "ClosedById",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Conversations_users_ClosedById",
                table: "Conversations");

            migrationBuilder.DropIndex(
                name: "IX_Conversations_ClosedById",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "ClosedAt",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "ClosedById",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "IsClosed",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "OpenedAt",
                table: "Conversations");
        }
    }
}
