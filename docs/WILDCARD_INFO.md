# ZotMoov Wildcard Formatting

ZotMoov keeps many of the same wildcards that Zotfile, as well as the conditional and or wildcard operators

## Wildcards
- `%a` last names of the first author
- `%b` citation key
- `%I` author initials.
- `%F` author's last name with first letter of first name (e.g. DoeJ).
- `%A` first letter of author
- `%y` year
- `%t` title
- `%T` item type (localized)
- `%j` name of the journal
- `%p` name of the publisher
- `%w` name of the journal or publisher (same as "%j|%p")
- `%s` journal abbreviation
- `%v` journal volume
- `%e` journal issue
- `%f` pages
- `%c` collection path. If your item was in collection Top > Bottom > Item, %c will be substituted to "Top/Bottom" 

## Conditional

Only add the characters inside the curly brackets if ALL of the wildcards can be replaced. Otherwise, replace nothing.

{% raw %}

- `{%y/}{%j (%s)/}{%A/}` - "2002/American Journal of Sociology (AJS)/A/" if BOTH %j AND %s can be replaced, otherwise "2002/A/"

{% endraw %}


## Or

Insert the first wildcard that can be replaced. Note that characters between the wildcard and the `|` will be removed.

{% raw %}

- `{(%s | %j)}` - "(AJS)" if %s can be replaced. "(American Journal of Sociology)" if %s cannot be replaced and %j can be replaced. "" if neither can be replaced.

{% endraw %}