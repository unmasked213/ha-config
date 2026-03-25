# Skill: Add New WhatsApp Contact

> **Trigger:** `/new-whatsapp-contact` or "add a new WhatsApp contact"
> **Purpose:** Add a contact to all required maps and create helper entities

## Required Information

Before starting, collect:
1. **Short name** (e.g., "Ben") — used in UI and code
2. **Full name** (e.g., "Ben Tarrant") — for sender matching
3. **Phone number** — UK format without +, e.g., `447123456789`

## Step-by-Step Procedure

### Step 1: Determine Next Contact Number

Check existing contacts in `packages/communication/whatsapp_config.yaml`:
- Look for `contact0X.txt` references
- Find the next available number (e.g., if contact04 exists, use contact05)

### Step 2: Create Helper Entities

Add to an appropriate package file (or create new section in `whatsapp_config.yaml`):

```yaml
input_boolean:
  whatsapp_c_unread_contact0X:
    name: "WhatsApp Unread Contact 0X"

input_number:
  whatsapp_c_unread_count_contact0X:
    name: "WhatsApp Unread Count Contact 0X"
    min: 0
    max: 100
    step: 1
    mode: box
```

Replace `0X` with the actual contact number.

### Step 3: Update Contact Mapping Sensor

In `packages/communication/whatsapp_config.yaml`, update `sensor.whatsapp_contacts_config`:

**Add to `contacts_by_name`:**
```yaml
"ShortName":
  file: "contact0X.txt"
  unread_boolean: "input_boolean.whatsapp_c_unread_contact0X"
  unread_count: "input_number.whatsapp_c_unread_count_contact0X"
  phone: "44XXXXXXXXXX@s.whatsapp.net"
  full_name: "Full Name Here"
```

**Add to `phone_to_name`:**
```yaml
"44XXXXXXXXXX@s.whatsapp.net": "ShortName"
```

**Add to `full_name_to_name`:**
```yaml
"Full Name Here": "ShortName"
```

### Step 4: Update Contact Dropdown

Find `input_select.whatsapp_contacts` and add the new short name to options:
```yaml
input_select:
  whatsapp_contacts:
    options:
      - "ExistingContact1"
      - "ExistingContact2"
      - "ExistingContact3"
      - "ExistingContact4"
      - "NewContact"  # Add here
```

### Step 5: Create History File (Optional)

Create empty file at:
```
/config/www/whatsapp_histories/contact0X.txt
```

This will be auto-populated when messages arrive.

## Verification Checklist

After completing all steps:

- [ ] Helper entities created (`input_boolean` + `input_number`)
- [ ] `contacts_by_name` map updated with all fields
- [ ] `phone_to_name` map updated
- [ ] `full_name_to_name` map updated
- [ ] `input_select.whatsapp_contacts` includes new name
- [ ] Phone format correct: `44XXXXXXXXXX@s.whatsapp.net` (no +, with suffix)

## Common Mistakes

- **Missing one of the three maps** — All three must be updated or lookups fail silently
- **Wrong phone format** — Must be `44...@s.whatsapp.net`, not `+44...` or just digits
- **Forgetting helper entities** — Unread tracking will break without both boolean and number
- **Mismatched names** — Short name must be identical across all locations (case-sensitive)

## Reference

See `packages/communication/CLAUDE.md` for full contact mapping documentation.
