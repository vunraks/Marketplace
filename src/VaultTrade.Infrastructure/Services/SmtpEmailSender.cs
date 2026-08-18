using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using VaultTrade.Application.Interfaces;
using VaultTrade.Infrastructure.Configurations;

namespace VaultTrade.Infrastructure.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly EmailSettings _settings;
    private readonly FrontendSettings _frontend;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(
        IOptions<EmailSettings> settings,
        IOptions<FrontendSettings> frontend,
        ILogger<SmtpEmailSender> logger)
    {
        _settings = settings.Value;
        _frontend = frontend.Value;
        _logger = logger;
    }

    public async Task SendPasswordResetAsync(string email, string username, string rawToken, CancellationToken cancellationToken = default)
    {
        var resetUrl = BuildResetUrl(rawToken);

        if (string.IsNullOrWhiteSpace(_settings.SmtpHost) || string.IsNullOrWhiteSpace(_settings.FromEmail))
        {
            _logger.LogWarning("SMTP is not configured. Password reset link for {Email}: {ResetUrl}", email, resetUrl);
            return;
        }

        try
        {
            using var message = new MailMessage
            {
                From = new MailAddress(_settings.FromEmail, _settings.FromName),
                Subject = "VaultTrade password reset",
                Body = $"""
                    Hello, {username}.

                    Open this link to reset your password:
                    {resetUrl}

                    The link is valid for 1 hour. If you did not request a password reset, ignore this email.
                    """,
                IsBodyHtml = false
            };

            message.To.Add(email);

            using var client = new SmtpClient(_settings.SmtpHost, _settings.Port)
            {
                EnableSsl = _settings.EnableSsl
            };

            if (!string.IsNullOrWhiteSpace(_settings.Username))
                client.Credentials = new NetworkCredential(_settings.Username, _settings.Password);

            await client.SendMailAsync(message, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                "Failed to send password reset email to {Email}: {Error}. Password reset link: {ResetUrl}",
                email,
                ex.Message,
                resetUrl);
        }
    }

    private string BuildResetUrl(string rawToken)
    {
        var baseUrl = string.IsNullOrWhiteSpace(_frontend.BaseUrl)
            ? "http://localhost:5173"
            : _frontend.BaseUrl.TrimEnd('/');

        return $"{baseUrl}/reset-password?token={Uri.EscapeDataString(rawToken)}";
    }
}
