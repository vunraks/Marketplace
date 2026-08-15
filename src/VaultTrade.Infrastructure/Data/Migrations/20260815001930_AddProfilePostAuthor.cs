using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VaultTrade.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProfilePostAuthor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AuthorId",
                table: "profile_posts",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql("""UPDATE profile_posts SET "AuthorId" = "UserId" WHERE "AuthorId" IS NULL;""");

            migrationBuilder.AlterColumn<Guid>(
                name: "AuthorId",
                table: "profile_posts",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_profile_posts_AuthorId",
                table: "profile_posts",
                column: "AuthorId");

            migrationBuilder.AddForeignKey(
                name: "FK_profile_posts_users_AuthorId",
                table: "profile_posts",
                column: "AuthorId",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_profile_posts_users_AuthorId",
                table: "profile_posts");

            migrationBuilder.DropIndex(
                name: "IX_profile_posts_AuthorId",
                table: "profile_posts");

            migrationBuilder.DropColumn(
                name: "AuthorId",
                table: "profile_posts");
        }
    }
}
