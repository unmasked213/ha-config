# CLAUDE - Network

> **Scope:** Device scanning, MAC mapping
> **Last reviewed:** 2026-02
> **Read root CLAUDE.md first for session protocol and universal rules**

---

## Summary

Manages network device discovery and identification across the 192.168.4.0/24 subnet. Maintains a comprehensive MAC-to-device mapping of 63 devices spanning network infrastructure, smart home hubs, sensors, cameras, lights, power plugs, and personal devices.

---

## Structure

| File | Purpose |
|------|---------|
| `ip_and_mac_address_mapping.yaml` | Network scanner config for 192.168.4.0/24 subnet with 63 MAC-to-device mappings |

---

## Key Components

- **`ip_and_mac_address_mapping.yaml`** — Single entry point for the entire domain. Contains the network scanner configuration and all MAC address mappings in the format `mac_mapping_N: "MAC;Friendly Name;Manufacturer"`.

### Device Categories and Counts

| Category | Count | Examples |
|----------|-------|---------|
| Network infrastructure | 5 | Eero router/extender, HA server, ESPresense, door socket |
| Hubs/assistants | 7 | Aqara, Hue Bridge, SwitchBot hubs, Echo devices |
| Sensors | 8 | 6x Aqara FP2, 2x Tuya |
| Cameras | 7 | 5x Reolink, IP camera, USB plug cam |
| Lights | 2 | Elgato panel + key light |
| Power plugs | 19 | Meross EX and MPM series |
| Personal devices | 10 | Phones, tablets, PCs, laptops |
| Other | 5 | Levoit purifier/humidifier, Sonos, generics |

---

## Development Workflows

### Adding a New Device

1. Identify the device's MAC address and manufacturer
2. Open `ip_and_mac_address_mapping.yaml`
3. Add a new entry continuing the sequential numbering from `mac_mapping_64` (or the next available number)
4. Use the format: `mac_mapping_N: "MAC;Friendly Name;Manufacturer"`

---

## Conventions for AI Assistants

### Critical Constraints

#### MAC Address Mapping Maintenance

Mappings are numbered sequentially (`mac_mapping_1` through `mac_mapping_63`) with format:
```
mac_mapping_N: "MAC;Friendly Name;Manufacturer"
```

When adding a new device, continue the sequential numbering from `mac_mapping_64`.

### Coupling Warnings

**This domain depends on:**
- Network Scanner custom integration (`custom_components/network_scanner`)

### Cross-References

- Root: /CLAUDE.md
- Server (git sync -- configuration version control): packages/server/github_sync.yaml

---

## TODOs & Gaps

None currently identified.

---

## Changelog

| Date | Commit | Note |
|------|--------|------|
| 2026-02-24 | `b350903` | Restructured to 8-section format; all existing content preserved |

---

*Last Updated: 2026-02-24*
