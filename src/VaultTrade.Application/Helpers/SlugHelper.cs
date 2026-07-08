using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace VaultTrade.Application.Helpers;

public static partial class SlugHelper
{
    public static string GenerateSlug(string title)
    {
        var slug = title.Trim().ToLowerInvariant();
        slug = Transliterate(slug);
        slug = NonAlphaNumeric().Replace(slug, "-");
        slug = MultiDash().Replace(slug, "-").Trim('-');
        return slug.Length > 200 ? slug[..200].Trim('-') : slug;
    }

    public static string AppendUniqueSuffix(string slug)
    {
        return $"{slug}-{Guid.NewGuid().ToString("N")[..8]}";
    }

    private static string Transliterate(string input)
    {
        var map = new Dictionary<char, string>
        {
            ['а'] = "a", ['б'] = "b", ['в'] = "v", ['г'] = "g", ['д'] = "d",
            ['е'] = "e", ['ё'] = "e", ['ж'] = "zh", ['з'] = "z", ['и'] = "i",
            ['й'] = "y", ['к'] = "k", ['л'] = "l", ['м'] = "m", ['н'] = "n",
            ['о'] = "o", ['п'] = "p", ['р'] = "r", ['с'] = "s", ['т'] = "t",
            ['у'] = "u", ['ф'] = "f", ['х'] = "h", ['ц'] = "ts", ['ч'] = "ch",
            ['ш'] = "sh", ['щ'] = "sch", ['ъ'] = "", ['ы'] = "y", ['ь'] = "",
            ['э'] = "e", ['ю'] = "yu", ['я'] = "ya"
        };

        var sb = new StringBuilder(input.Length);
        foreach (var c in input)
        {
            if (map.TryGetValue(c, out var replacement))
                sb.Append(replacement);
            else
                sb.Append(c);
        }

        return sb.ToString();
    }

    [GeneratedRegex(@"[^a-z0-9\-]+")]
    private static partial Regex NonAlphaNumeric();

    [GeneratedRegex(@"-+")]
    private static partial Regex MultiDash();
}

public static class OrderNumberGenerator
{
    public static string Generate()
    {
        return $"VT-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(100000, 999999)}";
    }
}
