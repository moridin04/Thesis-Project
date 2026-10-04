# Turn one value into a list so a caller can loop over it.
# None becomes an empty list. A list, tuple, or set is copied.
# Any other value is wrapped as a one-item list.
def ensure_iterable(value):
    if value is None:
        return []
    if isinstance(value, (list, tuple, set)):
        return list(value)
    return [value]
