```
╭────────────────────────────────────────────────╮
│  config                                        │
│  //192.168.4.101/config/                       │
├────────────────────────────────────────────────┤
│  Scanned: 2026-03-25 02:19  |  Took: 12.96s    │
╰────────────────────────────────────────────────╯

📁 config/  (Total: 268 folders, 1476 files, 104 MB)
│
├── 📁 ai_adversarial_system/  (3 folders, 3 files, 45 KB)
│   │
│   ├── 📁 AI-Adversarial-System-main/  (4 files, 50 KB)
│   │   ├── compliance-document.md
│   │   ├── context.md
│   │   ├── project-plan.md
│   │   ╰── README.md
│   │
│   ├── 📁 archive/  (1 file, 106 KB)
│   │   ╰── 2026-02-04-dad-car-detection.md
│   │
│   ├── 📁 workspace/  (4 files, 14 KB)
│   │   ├── confidence_tier.jinja2
│   │   ├── dad_car_detection_entities.md
│   │   ├── README.md
│   │   ╰── sensor_health.jinja2
│   │
│   ├── CLAUDE.md
│   ├── handoff.md
│   ╰── README.md
│
├── 📁 appdaemon/  (5 folders, 1 file, 232 bytes)
│   │
│   ├── 📁 apps/  (2 files, 274 bytes)
│   │   ├── apps.yaml
│   │   ╰── hello.py
│   │
│   ├── 📁 compiled/  (2 folders)
│   │   │
│   │   ├── 📁 css/
│   │   │
│   │   ╰── 📁 javascript/
│   │
│   ├── 📁 dashboards/  (1 file, 201 bytes)
│   │   ╰── Hello.dash
│   │
│   ├── 📁 namespaces/
│   │
│   ├── 📁 www/
│   │
│   ╰── appdaemon.yaml
│
├── 📁 bin/  (1 file, 64 MB)
│   ╰── rclone
│
├── 📁 blueprints/  (3 folders)
│   │
│   ├── 📁 automation/  (4 folders)
│   │   │
│   │   ├── 📁 balloob/  (1 file, 2 KB)
│   │   │   ╰── ai-camera-analysis.yaml
│   │   │
│   │   ├── 📁 homeassistant/  (2 files, 2 KB)
│   │   │   ├── motion_light.yaml
│   │   │   ╰── notify_leaving_zone.yaml
│   │   │
│   │   ├── 📁 Oshayr/  (1 file, 10 KB)
│   │   │   ╰── heartbeat.yaml
│   │   │
│   │   ╰── 📁 valentinfrlch/  (1 file, 26 KB)
│   │       ╰── event_summary.yaml
│   │
│   ├── 📁 script/  (1 folder)
│   │   │
│   │   ╰── 📁 homeassistant/  (2 files, 9 KB)
│   │       ├── ask_yes_no_question.yaml
│   │       ╰── confirmable_notification.yaml
│   │
│   ╰── 📁 template/  (1 folder)
│       │
│       ╰── 📁 homeassistant/  (1 file, 971 bytes)
│           ╰── inverted_binary_sensor.yaml
│
├── 📁 custom_components/  (33 folders)
│   │
│   ├── 📁 ai_automation_suggester/  (3 folders, 8 files, 69 KB)
│   │   │
│   │   ├── 📁 automations/  (2 files, 3 KB)
│   │   │   ├── new-entity-automation.yaml
│   │   │   ╰── weekly-review-automation.yaml
│   │   │
│   │   ├── 📁 translations/  (5 files, 9 KB)
│   │   │   ├── de.json
│   │   │   ├── en.json
│   │   │   ├── it.json
│   │   │   ├── nl.json
│   │   │   ╰── zh.json
│   │   │
│   │   ├── 📁 www/  (1 folder)
│   │   │   │
│   │   │   ╰── 📁 ai_automation_suggester/  (1 file, 3 KB)
│   │   │       ╰── ai-automation-suggester-card.js
│   │   │
│   │   ├── __init__.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── coordinator.py
│   │   ├── manifest.json
│   │   ├── sensor.py
│   │   ├── services.yaml
│   │   ╰── strings.json
│   │
│   ├── 📁 alexa_media/  (1 folder, 22 files, 428 KB)
│   │   │
│   │   ├── 📁 translations/  (17 files, 146 KB)
│   │   │   ├── ar.json
│   │   │   ├── bg.json
│   │   │   ├── bg_BG.json
│   │   │   ├── de.json
│   │   │   ├── en.json
│   │   │   ├── es.json
│   │   │   ├── fr.json
│   │   │   ├── it.json
│   │   │   ├── ja.json
│   │   │   ├── nb.json
│   │   │   ├── nl.json
│   │   │   ├── pl.json
│   │   │   ├── pt-BR.json
│   │   │   ├── pt.json
│   │   │   ├── ru.json
│   │   │   ├── sv.json
│   │   │   ╰── zh-Hans.json
│   │   │
│   │   ├── __init__.py
│   │   ├── alarm_control_panel.py
│   │   ├── alexa_entity.py
│   │   ├── alexa_media.py
│   │   ├── binary_sensor.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── coordinator.py
│   │   ├── diagnostics.py
│   │   ├── exceptions.py
│   │   ├── helpers.py
│   │   ├── light.py
│   │   ├── manifest.json
│   │   ├── media_player.py
│   │   ├── metrics.py
│   │   ├── notify.py
│   │   ├── runtime_data.py
│   │   ├── sensor.py
│   │   ├── services.py
│   │   ├── services.yaml
│   │   ├── strings.json
│   │   ╰── switch.py
│   │
│   ├── 📁 battery_notes/  (1 folder, 23 files, 232 KB)
│   │   │
│   │   ├── 📁 translations/  (28 files, 476 KB)
│   │   │   ├── ar.json
│   │   │   ├── ca.json
│   │   │   ├── cs.json
│   │   │   ├── da.json
│   │   │   ├── de.json
│   │   │   ├── el.json
│   │   │   ├── en.json
│   │   │   ├── es-ES.json
│   │   │   ├── fi.json
│   │   │   ├── fr.json
│   │   │   ├── hu.json
│   │   │   ├── it.json
│   │   │   ├── lt.json
│   │   │   ├── lv.json
│   │   │   ├── nl.json
│   │   │   ├── no.json
│   │   │   ├── pl.json
│   │   │   ├── pt-BR.json
│   │   │   ├── pt.json
│   │   │   ├── ru.json
│   │   │   ├── sk.json
│   │   │   ├── sr-Latn.json
│   │   │   ├── sv-SE.json
│   │   │   ├── tr.json
│   │   │   ├── uk.json
│   │   │   ├── ur-IN.json
│   │   │   ├── zh-Hans.json
│   │   │   ╰── zh-Hant.json
│   │   │
│   │   ├── __init__.py
│   │   ├── binary_sensor.py
│   │   ├── button.py
│   │   ├── common.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── coordinator.py
│   │   ├── diagnostics.py
│   │   ├── discovery.py
│   │   ├── entity.py
│   │   ├── errors.py
│   │   ├── filters.py
│   │   ├── icons.json
│   │   ├── library.py
│   │   ├── library_updater.py
│   │   ├── manifest.json
│   │   ├── repairs.py
│   │   ├── schema.json
│   │   ├── sensor.py
│   │   ├── services.py
│   │   ├── services.yaml
│   │   ├── store.py
│   │   ╰── template_helpers.py
│   │
│   ├── 📁 ble_monitor/  (3 folders, 11 files, 252 KB)
│   │   │
│   │   ├── 📁 ble_parser/  (52 files, 265 KB)
│   │   │   ├── __init__.py
│   │   │   ├── acconeer.py
│   │   │   ├── airmentor.py
│   │   │   ├── almendo.py
│   │   │   ├── altbeacon.py
│   │   │   ├── amazfit.py
│   │   │   ├── atc.py
│   │   │   ├── beckett.py
│   │   │   ├── bluemaestro.py
│   │   │   ├── blustream.py
│   │   │   ├── bparasite.py
│   │   │   ├── bthome.py
│   │   │   ├── bthome_const.py
│   │   │   ├── chefiq.py
│   │   │   ├── const.py
│   │   │   ├── get_beacon_key.py
│   │   │   ├── govee.py
│   │   │   ├── grundfos.py
│   │   │   ├── helpers.py
│   │   │   ├── hhcc.py
│   │   │   ├── holyiot.py
│   │   │   ├── hormann.py
│   │   │   ├── ibeacon.py
│   │   │   ├── inkbird.py
│   │   │   ├── inode.py
│   │   │   ├── jaalee.py
│   │   │   ├── jinou.py
│   │   │   ├── kegtron.py
│   │   │   ├── kkm.py
│   │   │   ├── laica.py
│   │   │   ├── michelin.py
│   │   │   ├── mikrotik.py
│   │   │   ├── miscale.py
│   │   │   ├── moat.py
│   │   │   ├── mocreo.py
│   │   │   ├── oral_b.py
│   │   │   ├── oras.py
│   │   │   ├── qingping.py
│   │   │   ├── relsib.py
│   │   │   ├── ruuvitag.py
│   │   │   ├── sensirion.py
│   │   │   ├── sensorpush.py
│   │   │   ├── senssun.py
│   │   │   ├── smartdry.py
│   │   │   ├── sonoff.py
│   │   │   ├── switchbot.py
│   │   │   ├── teltonika.py
│   │   │   ├── thermobeacon.py
│   │   │   ├── thermopro.py
│   │   │   ├── tilt.py
│   │   │   ├── xiaogui.py
│   │   │   ╰── xiaomi.py
│   │   │
│   │   ├── 📁 test/  (49 files, 247 KB)
│   │   │   ├── __init__.py
│   │   │   ├── test_acconeer_parser.py
│   │   │   ├── test_airmentor.py
│   │   │   ├── test_almendo.py
│   │   │   ├── test_altbeacon_parser.py
│   │   │   ├── test_amazfit_parser.py
│   │   │   ├── test_atc_parser.py
│   │   │   ├── test_beckett.py
│   │   │   ├── test_bluemaestro.py
│   │   │   ├── test_blustream.py
│   │   │   ├── test_bparasite_parser.py
│   │   │   ├── test_bthome_v1.py
│   │   │   ├── test_bthome_v2.py
│   │   │   ├── test_chefiq.py
│   │   │   ├── test_govee_parser.py
│   │   │   ├── test_grundfos.py
│   │   │   ├── test_hhcc.py
│   │   │   ├── test_holyiot.py
│   │   │   ├── test_hormann.py
│   │   │   ├── test_ibeacon_parser.py
│   │   │   ├── test_inkbird.py
│   │   │   ├── test_inode_parser.py
│   │   │   ├── test_jaalee.py
│   │   │   ├── test_jinou.py
│   │   │   ├── test_kegtron_parser.py
│   │   │   ├── test_kkm.py
│   │   │   ├── test_laica.py
│   │   │   ├── test_michelin.py
│   │   │   ├── test_mikrotik.py
│   │   │   ├── test_miscale_parser.py
│   │   │   ├── test_moat_parser.py
│   │   │   ├── test_mocreo_parser.py
│   │   │   ├── test_oral_b.py
│   │   │   ├── test_oras.py
│   │   │   ├── test_qingping_parser.py
│   │   │   ├── test_relsib.py
│   │   │   ├── test_ruuvitag_parser.py
│   │   │   ├── test_sensirion_parser.py
│   │   │   ├── test_sensorpush_parser.py
│   │   │   ├── test_senssun_parser.py
│   │   │   ├── test_smartdry.py
│   │   │   ├── test_sonoff.py
│   │   │   ├── test_switchbot.py
│   │   │   ├── test_teltonika.py
│   │   │   ├── test_thermobeacon.py
│   │   │   ├── test_thermopro.py
│   │   │   ├── test_tilt.py
│   │   │   ├── test_xiaogui_parser.py
│   │   │   ╰── test_xiaomi_parser.py
│   │   │
│   │   ├── 📁 translations/  (16 files, 93 KB)
│   │   │   ├── de.json
│   │   │   ├── el.json
│   │   │   ├── en.json
│   │   │   ├── fr.json
│   │   │   ├── hu.json
│   │   │   ├── nl.json
│   │   │   ├── pl.json
│   │   │   ├── pt-BR.json
│   │   │   ├── pt.json
│   │   │   ├── ru.json
│   │   │   ├── sk.json
│   │   │   ├── sv.json
│   │   │   ├── uk.json
│   │   │   ├── ur.json
│   │   │   ├── zh-Hans.json
│   │   │   ╰── zh-Hant.json
│   │   │
│   │   ├── __init__.py
│   │   ├── binary_sensor.py
│   │   ├── bt_helpers.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── device_tracker.py
│   │   ├── helper.py
│   │   ├── manifest.json
│   │   ├── sensor.py
│   │   ├── services.yaml
│   │   ╰── strings.json
│   │
│   ├── 📁 browser_mod/  (20 files, 302 KB)
│   │   ├── __init__.py
│   │   ├── binary_sensor.py
│   │   ├── browser.py
│   │   ├── browser_mod.js
│   │   ├── browser_mod_panel.js
│   │   ├── camera.py
│   │   ├── config_flow.py
│   │   ├── connection.py
│   │   ├── const.py
│   │   ├── entities.py
│   │   ├── helpers.py
│   │   ├── light.py
│   │   ├── manifest.json
│   │   ├── media_player.py
│   │   ├── mod_view.py
│   │   ├── panel.py
│   │   ├── sensor.py
│   │   ├── service.py
│   │   ├── services.yaml
│   │   ╰── store.py
│   │
│   ├── 📁 chatreader/  (3 files, 4 KB)
│   │   ├── __init__.py
│   │   ├── manifest.json
│   │   ╰── sensor.py
│   │
│   ├── 📁 fallback_conversation/  (1 folder, 6 files, 15 KB)
│   │   │
│   │   ├── 📁 translations/  (1 file, 925 bytes)
│   │   │   ╰── en.json
│   │   │
│   │   ├── __init__.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── conversation.py
│   │   ├── manifest.json
│   │   ╰── strings.json
│   │
│   ├── 📁 frigate/  (1 folder, 21 files, 265 KB)
│   │   │
│   │   ├── 📁 translations/  (10 files, 19 KB)
│   │   │   ├── ca.json
│   │   │   ├── de.json
│   │   │   ├── en.json
│   │   │   ├── fr.json
│   │   │   ├── pt-BR.json
│   │   │   ├── pt.json
│   │   │   ├── ru.json
│   │   │   ├── sv.json
│   │   │   ├── tr.json
│   │   │   ╰── zh-Hans.json
│   │   │
│   │   ├── __init__.py
│   │   ├── api.py
│   │   ├── binary_sensor.py
│   │   ├── camera.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── diagnostics.py
│   │   ├── icons.py
│   │   ├── image.py
│   │   ├── llm_functions.py
│   │   ├── manifest.json
│   │   ├── media_source.py
│   │   ├── number.py
│   │   ├── select.py
│   │   ├── sensor.py
│   │   ├── services.yaml
│   │   ├── switch.py
│   │   ├── update.py
│   │   ├── views.py
│   │   ├── ws_api.py
│   │   ╰── ws_proxy.py
│   │
│   ├── 📁 ha_text_ai/  (1 folder, 13 files, 133 KB)
│   │   │
│   │   ├── 📁 translations/  (8 files, 108 KB)
│   │   │   ├── de.json
│   │   │   ├── en.json
│   │   │   ├── es.json
│   │   │   ├── hi.json
│   │   │   ├── it.json
│   │   │   ├── ru.json
│   │   │   ├── sr.json
│   │   │   ╰── zh.json
│   │   │
│   │   ├── __init__.py
│   │   ├── api_client.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── coordinator.py
│   │   ├── history.py
│   │   ├── manifest.json
│   │   ├── metrics.py
│   │   ├── providers.py
│   │   ├── sensor.py
│   │   ├── services.yaml
│   │   ├── strings.json
│   │   ╰── utils.py
│   │
│   ├── 📁 hacs/  (6 folders, 19 files, 92 KB)
│   │   │
│   │   ├── 📁 hacs_frontend/  (3 folders, 4 files, 959 bytes)
│   │   │   │
│   │   │   ├── 📁 frontend_es5/
│   │   │   │   ├── [806 entries]
│   │   │   │
│   │   │   ├── 📁 frontend_latest/
│   │   │   │   ├── [687 entries]
│   │   │   │
│   │   │   ├── 📁 static/  (3 folders)
│   │   │   │   │
│   │   │   │   ├── 📁 fonts/  (1 folder)
│   │   │   │   │   │
│   │   │   │   │   ╰── 📁 roboto/  (12 files, 791 KB)
│   │   │   │   │       ├── Roboto-Black.woff2
│   │   │   │   │       ├── Roboto-BlackItalic.woff2
│   │   │   │   │       ├── Roboto-Bold.woff2
│   │   │   │   │       ├── Roboto-BoldItalic.woff2
│   │   │   │   │       ├── Roboto-Light.woff2
│   │   │   │   │       ├── Roboto-LightItalic.woff2
│   │   │   │   │       ├── Roboto-Medium.woff2
│   │   │   │   │       ├── Roboto-MediumItalic.woff2
│   │   │   │   │       ├── Roboto-Regular.woff2
│   │   │   │   │       ├── Roboto-RegularItalic.woff2
│   │   │   │   │       ├── Roboto-Thin.woff2
│   │   │   │   │       ╰── Roboto-ThinItalic.woff2
│   │   │   │   │
│   │   │   │   ├── 📁 locale-data/  (5 folders)
│   │   │   │   │   │
│   │   │   │   │   ├── 📁 intl-datetimeformat/
│   │   │   │   │   │   ├── [128 entries]
│   │   │   │   │   │
│   │   │   │   │   ├── 📁 intl-displaynames/
│   │   │   │   │   │   ├── [125 entries]
│   │   │   │   │   │
│   │   │   │   │   ├── 📁 intl-listformat/
│   │   │   │   │   │   ├── [126 entries]
│   │   │   │   │   │
│   │   │   │   │   ├── 📁 intl-numberformat/
│   │   │   │   │   │   ├── [126 entries]
│   │   │   │   │   │
│   │   │   │   │   ╰── 📁 intl-relativetimeformat/
│   │   │   │   │       ├── [126 entries]
│   │   │   │   │
│   │   │   │   ╰── 📁 translations/  (54 files, 297 KB)
│   │   │   │       ├── bg_BG-09527297de325025baed93310aaffb45.json
│   │   │   │       ├── bg_BG-09527297de325025baed93310aaffb45.json.gz
│   │   │   │       ├── cs-e853beabffef9f4ecb88a25a53247836.json
│   │   │   │       ├── cs-e853beabffef9f4ecb88a25a53247836.json.gz
│   │   │   │       ├── da-e44866b8767f28a1a84d4c7fe3b72186.json
│   │   │   │       ├── da-e44866b8767f28a1a84d4c7fe3b72186.json.gz
│   │   │   │       ├── de-34d71321078b03bc1513199456f71e4a.json
│   │   │   │       ├── de-34d71321078b03bc1513199456f71e4a.json.gz
│   │   │   │       ├── el-21abbe0495b9c1b675d79863528bd523.json
│   │   │   │       ├── el-21abbe0495b9c1b675d79863528bd523.json.gz
│   │   │   │       ├── en-5cffb9426fe368fb8113b6c52cfbfd4a.json
│   │   │   │       ├── en-5cffb9426fe368fb8113b6c52cfbfd4a.json.gz
│   │   │   │       ├── es-e47763084dec5920a121a6424227796b.json
│   │   │   │       ├── es-e47763084dec5920a121a6424227796b.json.gz
│   │   │   │       ├── et-a6d1019a25788c712f62fa15337e62cd.json
│   │   │   │       ├── et-a6d1019a25788c712f62fa15337e62cd.json.gz
│   │   │   │       ├── fi-508d4031221091dea2681c41232a5b20.json
│   │   │   │       ├── fi-508d4031221091dea2681c41232a5b20.json.gz
│   │   │   │       ├── fr-e6506ae9e36089c807ae0570664026fb.json
│   │   │   │       ├── fr-e6506ae9e36089c807ae0570664026fb.json.gz
│   │   │   │       ├── he-644ea3a879599682f50ce271ae32f29e.json
│   │   │   │       ├── he-644ea3a879599682f50ce271ae32f29e.json.gz
│   │   │   │       ├── hu-6d81d4d17f38dcf25a921b80a570cffa.json
│   │   │   │       ├── hu-6d81d4d17f38dcf25a921b80a570cffa.json.gz
│   │   │   │       ├── id-dcf8f6cc6d80e84c0b9988535f88e8cb.json
│   │   │   │       ├── id-dcf8f6cc6d80e84c0b9988535f88e8cb.json.gz
│   │   │   │       ├── it-050764518d7b6ad923b910678a5efca0.json
│   │   │   │       ├── it-050764518d7b6ad923b910678a5efca0.json.gz
│   │   │   │       ├── nb-589d3252fdbdd218ee9766a0157fa111.json
│   │   │   │       ├── nb-589d3252fdbdd218ee9766a0157fa111.json.gz
│   │   │   │       ├── nl-0e614e8263122feab2e0089d3a978ded.json
│   │   │   │       ├── nl-0e614e8263122feab2e0089d3a978ded.json.gz
│   │   │   │       ├── nn-8115c86bccf15a0153a187aec08d52b0.json
│   │   │   │       ├── nn-8115c86bccf15a0153a187aec08d52b0.json.gz
│   │   │   │       ├── pl-62b6a3c2d70cd8bc58d36690418c5415.json
│   │   │   │       ├── pl-62b6a3c2d70cd8bc58d36690418c5415.json.gz
│   │   │   │       ├── pt-c479b23f3786ad79d8cb68bcc3fef00e.json
│   │   │   │       ├── pt-c479b23f3786ad79d8cb68bcc3fef00e.json.gz
│   │   │   │       ├── pt_BR-686378a3a60674d78a3b474a7d2ac2aa.json
│   │   │   │       ├── pt_BR-686378a3a60674d78a3b474a7d2ac2aa.json.gz
│   │   │   │       ├── ro-a59032e800e47341ee94512c3f418946.json
│   │   │   │       ├── ro-a59032e800e47341ee94512c3f418946.json.gz
│   │   │   │       ├── ru-9f216e358a3461af770c811cd62cc5af.json
│   │   │   │       ├── ru-9f216e358a3461af770c811cd62cc5af.json.gz
│   │   │   │       ├── sk-0dc0804113af5870932653b26df200c1.json
│   │   │   │       ├── sk-0dc0804113af5870932653b26df200c1.json.gz
│   │   │   │       ├── sl-02fdae1dba87cbe6afbd85465419510b.json
│   │   │   │       ├── sl-02fdae1dba87cbe6afbd85465419510b.json.gz
│   │   │   │       ├── sv-c3c8559e70c1ded2c27f5d2ebcddd814.json
│   │   │   │       ├── sv-c3c8559e70c1ded2c27f5d2ebcddd814.json.gz
│   │   │   │       ├── vi-2442dc957d6c5d0dce37d4948afb69d5.json
│   │   │   │       ├── vi-2442dc957d6c5d0dce37d4948afb69d5.json.gz
│   │   │   │       ├── zh_Hans-9f934b8659cd8e2874b6bacb205124e8.json
│   │   │   │       ╰── zh_Hans-9f934b8659cd8e2874b6bacb205124e8.json.gz
│   │   │   │
│   │   │   ├── __init__.py
│   │   │   ├── entrypoint.js
│   │   │   ├── extra.js
│   │   │   ╰── version.py
│   │   │
│   │   ├── 📁 repositories/  (8 files, 85 KB)
│   │   │   ├── __init__.py
│   │   │   ├── appdaemon.py
│   │   │   ├── base.py
│   │   │   ├── integration.py
│   │   │   ├── plugin.py
│   │   │   ├── python_script.py
│   │   │   ├── template.py
│   │   │   ╰── theme.py
│   │   │
│   │   ├── 📁 translations/  (1 file, 3 KB)
│   │   │   ╰── en.json
│   │   │
│   │   ├── 📁 utils/  (18 files, 32 KB)
│   │   │   ├── __init__.py
│   │   │   ├── configuration_schema.py
│   │   │   ├── data.py
│   │   │   ├── decode.py
│   │   │   ├── decorator.py
│   │   │   ├── file_system.py
│   │   │   ├── filters.py
│   │   │   ├── github_graphql_query.py
│   │   │   ├── json.py
│   │   │   ├── logger.py
│   │   │   ├── path.py
│   │   │   ├── queue_manager.py
│   │   │   ├── regex.py
│   │   │   ├── store.py
│   │   │   ├── url.py
│   │   │   ├── validate.py
│   │   │   ├── version.py
│   │   │   ╰── workarounds.py
│   │   │
│   │   ├── 📁 validate/  (13 files, 13 KB)
│   │   │   ├── __init__.py
│   │   │   ├── archived.py
│   │   │   ├── base.py
│   │   │   ├── brands.py
│   │   │   ├── description.py
│   │   │   ├── hacsjson.py
│   │   │   ├── images.py
│   │   │   ├── information.py
│   │   │   ├── integration_manifest.py
│   │   │   ├── issues.py
│   │   │   ├── manager.py
│   │   │   ├── README.md
│   │   │   ╰── topics.py
│   │   │
│   │   ├── 📁 websocket/  (4 files, 24 KB)
│   │   │   ├── __init__.py
│   │   │   ├── critical.py
│   │   │   ├── repositories.py
│   │   │   ╰── repository.py
│   │   │
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── coordinator.py
│   │   ├── data_client.py
│   │   ├── diagnostics.py
│   │   ├── entity.py
│   │   ├── enums.py
│   │   ├── exceptions.py
│   │   ├── frontend.py
│   │   ├── icons.json
│   │   ├── iconset.js
│   │   ├── manifest.json
│   │   ├── repairs.py
│   │   ├── switch.py
│   │   ├── system_health.py
│   │   ├── types.py
│   │   ╰── update.py
│   │
│   ├── 📁 lovelace_gen/  (2 files, 3 KB)
│   │   ├── __init__.py
│   │   ╰── manifest.json
│   │
│   ├── 📁 lunar_phase/  (1 folder, 10 files, 43 KB)
│   │   │
│   │   ├── 📁 translations/  (5 files, 8 KB)
│   │   │   ├── cs.json
│   │   │   ├── de.json
│   │   │   ├── en.json
│   │   │   ├── id.json
│   │   │   ╰── nl.json
│   │   │
│   │   ├── __init__.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── coordinator.py
│   │   ├── icons.json
│   │   ├── manifest.json
│   │   ├── moon.py
│   │   ├── moon_script.py
│   │   ├── sensor.py
│   │   ╰── strings.json
│   │
│   ├── 📁 meross_lan/  (5 folders, 23 files, 253 KB)
│   │   │
│   │   ├── 📁 devices/  (2 folders, 6 files, 84 KB)
│   │   │   │
│   │   │   ├── 📁 hub/  (2 files, 65 KB)
│   │   │   │   ├── __init__.py
│   │   │   │   ╰── mts100.py
│   │   │   │
│   │   │   ├── 📁 thermostat/  (5 files, 68 KB)
│   │   │   │   ├── __init__.py
│   │   │   │   ├── mts200.py
│   │   │   │   ├── mts300.py
│   │   │   │   ├── mts960.py
│   │   │   │   ╰── mtsthermostat.py
│   │   │   │
│   │   │   ├── diffuser.py
│   │   │   ├── garagedoor.py
│   │   │   ├── misc.py
│   │   │   ├── ms600.py
│   │   │   ├── mss.py
│   │   │   ╰── spray.py
│   │   │
│   │   ├── 📁 helpers/  (9 files, 306 KB)
│   │   │   ├── __init__.py
│   │   │   ├── component_api.py
│   │   │   ├── device.py
│   │   │   ├── entity.py
│   │   │   ├── manager.py
│   │   │   ├── meross_profile.py
│   │   │   ├── mqtt_profile.py
│   │   │   ├── namespaces.py
│   │   │   ╰── obfuscate.py
│   │   │
│   │   ├── 📁 merossclient/  (1 folder, 5 files, 67 KB)
│   │   │   │
│   │   │   ├── 📁 protocol/  (2 folders, 3 files, 24 KB)
│   │   │   │   │
│   │   │   │   ├── 📁 namespaces/  (3 files, 35 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── hub.py
│   │   │   │   │   ╰── thermostat.py
│   │   │   │   │
│   │   │   │   ├── 📁 types/  (4 files, 10 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── control.py
│   │   │   │   │   ├── sensor.py
│   │   │   │   │   ╰── thermostat.py
│   │   │   │   │
│   │   │   │   ├── __init__.py
│   │   │   │   ├── const.py
│   │   │   │   ╰── message.py
│   │   │   │
│   │   │   ├── __init__.py
│   │   │   ├── api.http
│   │   │   ├── cloudapi.py
│   │   │   ├── httpclient.py
│   │   │   ╰── mqttclient.py
│   │   │
│   │   ├── 📁 traces/  (2 files, 18 KB)
│   │   │   ├── 2024-09-22_00-47-04_02be0e949778b9e3c394909b44702b1c.csv
│   │   │   ╰── mss310-1705460596.csv
│   │   │
│   │   ├── 📁 translations/  (8 files, 120 KB)
│   │   │   ├── cs.json
│   │   │   ├── de.json
│   │   │   ├── en.json
│   │   │   ├── es.json
│   │   │   ├── fr.json
│   │   │   ├── it.json
│   │   │   ├── ja.json
│   │   │   ╰── pl.json
│   │   │
│   │   ├── __init__.py
│   │   ├── binary_sensor.py
│   │   ├── button.py
│   │   ├── calendar.py
│   │   ├── climate.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── cover.py
│   │   ├── diagnostics.py
│   │   ├── fan.py
│   │   ├── icons.json
│   │   ├── light.py
│   │   ├── manifest.json
│   │   ├── media_player.py
│   │   ├── number.py
│   │   ├── repairs.py
│   │   ├── select.py
│   │   ├── sensor.py
│   │   ├── services.yaml
│   │   ├── strings.json
│   │   ├── switch.py
│   │   ├── time.py
│   │   ╰── update.py
│   │
│   ├── 📁 nationalrailtimes/  (1 folder, 9 files, 87 KB)
│   │   │
│   │   ├── 📁 translations/  (1 file, 1 KB)
│   │   │   ╰── en.json
│   │   │
│   │   ├── __init__.py
│   │   ├── api.py
│   │   ├── apidata.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── manifest.json
│   │   ├── sensor.py
│   │   ├── station_codes.py
│   │   ╰── strings.json
│   │
│   ├── 📁 network_scanner/  (5 files, 7 KB)
│   │   ├── __init__.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── manifest.json
│   │   ╰── sensor.py
│   │
│   ├── 📁 nodered/  (1 folder, 19 files, 77 KB)
│   │   │
│   │   ├── 📁 translations/  (11 files, 4 KB)
│   │   │   ├── de.json
│   │   │   ├── dk.json
│   │   │   ├── en.json
│   │   │   ├── fr.json
│   │   │   ├── nb.json
│   │   │   ├── pl.json
│   │   │   ├── pt-BR.json
│   │   │   ├── pt-pt.json
│   │   │   ├── sk.json
│   │   │   ├── sv.json
│   │   │   ╰── zh-CN.json
│   │   │
│   │   ├── __init__.py
│   │   ├── binary_sensor.py
│   │   ├── button.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── discovery.py
│   │   ├── entity.py
│   │   ├── manifest.json
│   │   ├── number.py
│   │   ├── select.py
│   │   ├── sensor.py
│   │   ├── sentence.py
│   │   ├── services.yaml
│   │   ├── switch.py
│   │   ├── text.py
│   │   ├── time.py
│   │   ├── utils.py
│   │   ├── version.py
│   │   ╰── websocket.py
│   │
│   ├── 📁 openai_gpt4o_tts/  (1 folder, 7 files, 28 KB)
│   │   │
│   │   ├── 📁 images/
│   │   │
│   │   ├── __init__.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── gpt4o.py
│   │   ├── manifest.json
│   │   ├── README.md
│   │   ╰── tts.py
│   │
│   ├── 📁 petkit/  (1 folder, 18 files, 420 KB)
│   │   │
│   │   ├── 📁 translations/  (11 files, 483 KB)
│   │   │   ├── bg.json
│   │   │   ├── en.json
│   │   │   ├── es.json
│   │   │   ├── fr.json
│   │   │   ├── hr.json
│   │   │   ├── it.json
│   │   │   ├── ja.json
│   │   │   ├── pl.json
│   │   │   ├── ru.json
│   │   │   ├── zh-Hans.json
│   │   │   ╰── zh-Hant.json
│   │   │
│   │   ├── __init__.py
│   │   ├── binary_sensor.py
│   │   ├── button.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── coordinator.py
│   │   ├── exceptions.py
│   │   ├── fan.py
│   │   ├── litter_events.py
│   │   ├── manifest.json
│   │   ├── number.py
│   │   ├── select.py
│   │   ├── sensor.py
│   │   ├── strings.json
│   │   ├── switch.py
│   │   ├── text.py
│   │   ├── timezones.py
│   │   ╰── util.py
│   │
│   ├── 📁 pirateweather/  (1 folder, 8 files, 105 KB)
│   │   │
│   │   ├── 📁 translations/  (6 files, 26 KB)
│   │   │   ├── cs.json
│   │   │   ├── de.json
│   │   │   ├── en.json
│   │   │   ├── nl.json
│   │   │   ├── pl.json
│   │   │   ╰── sk.json
│   │   │
│   │   ├── __init__.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── forecast_models.py
│   │   ├── manifest.json
│   │   ├── sensor.py
│   │   ├── weather.py
│   │   ╰── weather_update_coordinator.py
│   │
│   ├── 📁 places/  (2 folders, 10 files, 153 KB)
│   │   │
│   │   ├── 📁 json_sensors/  (2 files, 6 KB)
│   │   │   ├── places-08d246f6f41ecbe11444650cdc76db48.json
│   │   │   ╰── places-3631f9e8e9852cb1b0d7c1f7be6d81b2.json
│   │   │
│   │   ├── 📁 translations/  (6 files, 28 KB)
│   │   │   ├── cs.json
│   │   │   ├── en.json
│   │   │   ├── it.json
│   │   │   ├── ru.json
│   │   │   ├── sk.json
│   │   │   ╰── uk.json
│   │   │
│   │   ├── __init__.py
│   │   ├── advanced_options.py
│   │   ├── basic_options.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── helpers.py
│   │   ├── manifest.json
│   │   ├── parse_osm.py
│   │   ├── sensor.py
│   │   ╰── update_sensor.py
│   │
│   ├── 📁 populartimes/  (3 files, 3 KB)
│   │   ├── __init__.py
│   │   ├── manifest.json
│   │   ╰── sensor.py
│   │
│   ├── 📁 powercalc/  (10 folders, 16 files, 151 KB)
│   │   │
│   │   ├── 📁 analytics/  (2 files, 9 KB)
│   │   │   ├── __init__.py
│   │   │   ╰── analytics.py
│   │   │
│   │   ├── 📁 configuration/  (2 files, 4 KB)
│   │   │   ├── __init__.py
│   │   │   ╰── global_config.py
│   │   │
│   │   ├── 📁 filter/  (2 files, 1 KB)
│   │   │   ├── __init__.py
│   │   │   ╰── outlier.py
│   │   │
│   │   ├── 📁 flow_helper/  (1 folder, 4 files, 8 KB)
│   │   │   │
│   │   │   ├── 📁 flows/  (7 files, 73 KB)
│   │   │   │   ├── __init__.py
│   │   │   │   ├── daily_energy.py
│   │   │   │   ├── global_configuration.py
│   │   │   │   ├── group.py
│   │   │   │   ├── library.py
│   │   │   │   ├── real_power.py
│   │   │   │   ╰── virtual_power.py
│   │   │   │
│   │   │   ├── __init__.py
│   │   │   ├── common.py
│   │   │   ├── dynamic_field_builder.py
│   │   │   ╰── schema.py
│   │   │
│   │   ├── 📁 group_include/  (3 files, 18 KB)
│   │   │   ├── __init__.py
│   │   │   ├── filter.py
│   │   │   ╰── include.py
│   │   │
│   │   ├── 📁 power_profile/  (1 folder, 6 files, 36 KB)
│   │   │   │
│   │   │   ├── 📁 loader/  (5 files, 26 KB)
│   │   │   │   ├── __init__.py
│   │   │   │   ├── composite.py
│   │   │   │   ├── local.py
│   │   │   │   ├── protocol.py
│   │   │   │   ╰── remote.py
│   │   │   │
│   │   │   ├── __init__.py
│   │   │   ├── error.py
│   │   │   ├── factory.py
│   │   │   ├── library.py
│   │   │   ├── power_profile.py
│   │   │   ╰── sub_profile_selector.py
│   │   │
│   │   ├── 📁 sensors/  (1 folder, 6 files, 68 KB)
│   │   │   │
│   │   │   ├── 📁 group/  (8 files, 60 KB)
│   │   │   │   ├── __init__.py
│   │   │   │   ├── config_entry_utils.py
│   │   │   │   ├── custom.py
│   │   │   │   ├── domain.py
│   │   │   │   ├── factory.py
│   │   │   │   ├── standby.py
│   │   │   │   ├── subtract.py
│   │   │   │   ╰── tracked_untracked.py
│   │   │   │
│   │   │   ├── __init__.py
│   │   │   ├── abstract.py
│   │   │   ├── daily_energy.py
│   │   │   ├── energy.py
│   │   │   ├── power.py
│   │   │   ╰── utility_meter.py
│   │   │
│   │   ├── 📁 service/  (2 files, 1 KB)
│   │   │   ├── __init__.py
│   │   │   ╰── gui_configuration.py
│   │   │
│   │   ├── 📁 strategy/  (11 files, 64 KB)
│   │   │   ├── __init__.py
│   │   │   ├── composite.py
│   │   │   ├── factory.py
│   │   │   ├── fixed.py
│   │   │   ├── linear.py
│   │   │   ├── lut.py
│   │   │   ├── multi_switch.py
│   │   │   ├── playbook.py
│   │   │   ├── selector.py
│   │   │   ├── strategy_interface.py
│   │   │   ╰── wled.py
│   │   │
│   │   ├── 📁 translations/  (14 files, 644 KB)
│   │   │   ├── cz.json
│   │   │   ├── de.json
│   │   │   ├── en.json
│   │   │   ├── es.json
│   │   │   ├── fr.json
│   │   │   ├── it.json
│   │   │   ├── nl.json
│   │   │   ├── pl.json
│   │   │   ├── pt-BR.json
│   │   │   ├── pt.json
│   │   │   ├── ro.json
│   │   │   ├── ru.json
│   │   │   ├── sk.json
│   │   │   ╰── sv.json
│   │   │
│   │   ├── __init__.py
│   │   ├── common.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── device_binding.py
│   │   ├── diagnostics.py
│   │   ├── discovery.py
│   │   ├── errors.py
│   │   ├── helpers.py
│   │   ├── icons.json
│   │   ├── manifest.json
│   │   ├── migrate.py
│   │   ├── repairs.py
│   │   ├── select.py
│   │   ├── sensor.py
│   │   ╰── services.yaml
│   │
│   ├── 📁 prompt_manager/  (5 files, 4 KB)
│   │   ├── __init__.py
│   │   ├── const.py
│   │   ├── manifest.json
│   │   ├── services.yaml
│   │   ╰── websocket_api.py
│   │
│   ├── 📁 pyscript/  (2 folders, 18 files, 301 KB)
│   │   │
│   │   ├── 📁 stubs/  (2 files, 33 KB)
│   │   │   ├── generator.py
│   │   │   ╰── pyscript_builtins.py
│   │   │
│   │   ├── 📁 translations/  (4 files, 6 KB)
│   │   │   ├── de.json
│   │   │   ├── en.json
│   │   │   ├── sk.json
│   │   │   ╰── tr.json
│   │   │
│   │   ├── __init__.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── entity.py
│   │   ├── eval.py
│   │   ├── event.py
│   │   ├── function.py
│   │   ├── global_ctx.py
│   │   ├── jupyter_kernel.py
│   │   ├── logbook.py
│   │   ├── manifest.json
│   │   ├── mqtt.py
│   │   ├── requirements.py
│   │   ├── services.yaml
│   │   ├── state.py
│   │   ├── strings.json
│   │   ├── trigger.py
│   │   ╰── webhook.py
│   │
│   ├── 📁 room_selector/  (1 file, 5 KB)
│   │   ╰── room-selector-card.js
│   │
│   ├── 📁 sleep_as_android/  (1 folder, 6 files, 27 KB)
│   │   │
│   │   ├── 📁 translations/  (5 files, 12 KB)
│   │   │   ├── de.json
│   │   │   ├── en.json
│   │   │   ├── nl.json
│   │   │   ├── pl.json
│   │   │   ╰── ru.json
│   │   │
│   │   ├── __init__.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── device_trigger.py
│   │   ├── manifest.json
│   │   ╰── sensor.py
│   │
│   ├── 📁 sleep_as_android_mqtt/  (1 folder, 6 files, 27 KB)
│   │   │
│   │   ├── 📁 translations/  (5 files, 12 KB)
│   │   │   ├── de.json
│   │   │   ├── en.json
│   │   │   ├── nl.json
│   │   │   ├── pl.json
│   │   │   ╰── ru.json
│   │   │
│   │   ├── __init__.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── device_trigger.py
│   │   ├── manifest.json
│   │   ╰── sensor.py
│   │
│   ├── 📁 spook/  (3 folders, 17 files, 92 KB)
│   │   │
│   │   ├── 📁 ectoplasms/  (22 folders, 1 file, 26 bytes)
│   │   │   │
│   │   │   ├── 📁 automation/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 repairs/  (7 files, 23 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── unknown_area_references.py
│   │   │   │   │   ├── unknown_device_references.py
│   │   │   │   │   ├── unknown_entity_references.py
│   │   │   │   │   ├── unknown_floor_references.py
│   │   │   │   │   ├── unknown_label_references.py
│   │   │   │   │   ╰── unknown_service_references.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 blueprint/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 services/  (2 files, 2 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ╰── importer.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 group/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 repairs/  (2 files, 2 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ╰── unknown_members.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 homeassistant/  (1 folder, 4 files, 29 KB)
│   │   │   │   │
│   │   │   │   ├── 📁 services/  (41 files, 46 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── add_alias_to_area.py
│   │   │   │   │   ├── add_alias_to_floor.py
│   │   │   │   │   ├── add_area_to_floor.py
│   │   │   │   │   ├── add_device_to_area.py
│   │   │   │   │   ├── add_entity_to_area.py
│   │   │   │   │   ├── add_label_to_area.py
│   │   │   │   │   ├── add_label_to_device.py
│   │   │   │   │   ├── add_label_to_entity.py
│   │   │   │   │   ├── create_area.py
│   │   │   │   │   ├── create_floor.py
│   │   │   │   │   ├── create_label.py
│   │   │   │   │   ├── delete_all_orphaned_entities.py
│   │   │   │   │   ├── delete_area.py
│   │   │   │   │   ├── delete_floor.py
│   │   │   │   │   ├── delete_label.py
│   │   │   │   │   ├── disable_config_entry.py
│   │   │   │   │   ├── disable_device.py
│   │   │   │   │   ├── disable_entity.py
│   │   │   │   │   ├── disable_polling.py
│   │   │   │   │   ├── enable_config_entry.py
│   │   │   │   │   ├── enable_device.py
│   │   │   │   │   ├── enable_entity.py
│   │   │   │   │   ├── enable_polling.py
│   │   │   │   │   ├── hide_entity.py
│   │   │   │   │   ├── ignore_all_discovered.py
│   │   │   │   │   ├── list_orphaned_database_entities.py
│   │   │   │   │   ├── remove_alias_from_area.py
│   │   │   │   │   ├── remove_alias_from_floor.py
│   │   │   │   │   ├── remove_area_from_floor.py
│   │   │   │   │   ├── remove_device_from_area.py
│   │   │   │   │   ├── remove_entity_from_area.py
│   │   │   │   │   ├── remove_label_from_area.py
│   │   │   │   │   ├── remove_label_from_device.py
│   │   │   │   │   ├── remove_label_from_entity.py
│   │   │   │   │   ├── rename_entity.py
│   │   │   │   │   ├── restart.py
│   │   │   │   │   ├── set_area_aliases.py
│   │   │   │   │   ├── set_floor_aliases.py
│   │   │   │   │   ├── unhide_entity.py
│   │   │   │   │   ╰── update_entity_id.py
│   │   │   │   │
│   │   │   │   ├── __init__.py
│   │   │   │   ├── button.py
│   │   │   │   ├── entity.py
│   │   │   │   ╰── sensor.py
│   │   │   │
│   │   │   ├── 📁 input_number/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 services/  (5 files, 4 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── decrement.py
│   │   │   │   │   ├── increment.py
│   │   │   │   │   ├── max.py
│   │   │   │   │   ╰── min.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 input_select/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 services/  (4 files, 2 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── random.py
│   │   │   │   │   ├── shuffle.py
│   │   │   │   │   ╰── sort.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 integration/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 repairs/  (2 files, 2 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ╰── unknown_source.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 lovelace/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 repairs/  (2 files, 12 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ╰── unknown_entity_references.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 number/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 services/  (5 files, 4 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── decrement.py
│   │   │   │   │   ├── increment.py
│   │   │   │   │   ├── max.py
│   │   │   │   │   ╰── min.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 person/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 services/  (3 files, 3 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── add_device_tracker.py
│   │   │   │   │   ╰── remove_device_tracker.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 proximity/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 repairs/  (4 files, 6 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── unknown_ignored_zones.py
│   │   │   │   │   ├── unknown_tracked_entities.py
│   │   │   │   │   ╰── unknown_zone.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 recorder/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 services/  (2 files, 2 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ╰── import_statistics.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 repairs/  (1 folder, 5 files, 8 KB)
│   │   │   │   │
│   │   │   │   ├── 📁 services/  (5 files, 3 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── create.py
│   │   │   │   │   ├── ignore_all.py
│   │   │   │   │   ├── remove.py
│   │   │   │   │   ╰── unignore_all.py
│   │   │   │   │
│   │   │   │   ├── __init__.py
│   │   │   │   ├── button.py
│   │   │   │   ├── entity.py
│   │   │   │   ├── event.py
│   │   │   │   ╰── sensor.py
│   │   │   │
│   │   │   ├── 📁 scene/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 repairs/  (2 files, 2 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ╰── unknown_entity_references.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 script/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 repairs/  (6 files, 14 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── unknown_area_references.py
│   │   │   │   │   ├── unknown_device_references.py
│   │   │   │   │   ├── unknown_entity_references.py
│   │   │   │   │   ├── unknown_floor_references.py
│   │   │   │   │   ╰── unknown_label_references.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 select/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 services/  (2 files, 1 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ╰── random.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 spook/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 services/  (3 files, 1 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── boo.py
│   │   │   │   │   ╰── random_fail.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 switch_as_x/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 repairs/  (2 files, 2 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ╰── unknown_source.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 timer/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 services/  (2 files, 1 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ╰── set_duration.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 trend/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 repairs/  (2 files, 2 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ╰── unknown_source.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 utility_meter/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 repairs/  (2 files, 2 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ╰── unknown_source.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ├── 📁 zone/  (1 folder, 1 file, 26 bytes)
│   │   │   │   │
│   │   │   │   ├── 📁 services/  (4 files, 5 KB)
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── create.py
│   │   │   │   │   ├── delete.py
│   │   │   │   │   ╰── update.py
│   │   │   │   │
│   │   │   │   ╰── __init__.py
│   │   │   │
│   │   │   ╰── __init__.py
│   │   │
│   │   ├── 📁 integrations/  (1 folder, 1 file, 26 bytes)
│   │   │   │
│   │   │   ├── 📁 spook_inverse/  (1 folder, 7 files, 14 KB)
│   │   │   │   │
│   │   │   │   ├── 📁 translations/  (43 files, 46 KB)
│   │   │   │   │   ├── af.json
│   │   │   │   │   ├── ar.json
│   │   │   │   │   ├── be.json
│   │   │   │   │   ├── bg.json
│   │   │   │   │   ├── ca.json
│   │   │   │   │   ├── cs.json
│   │   │   │   │   ├── da.json
│   │   │   │   │   ├── de.json
│   │   │   │   │   ├── el.json
│   │   │   │   │   ├── en.json
│   │   │   │   │   ├── es.json
│   │   │   │   │   ├── et.json
│   │   │   │   │   ├── fi.json
│   │   │   │   │   ├── fr.json
│   │   │   │   │   ├── gl.json
│   │   │   │   │   ├── he.json
│   │   │   │   │   ├── hr.json
│   │   │   │   │   ├── hu.json
│   │   │   │   │   ├── id.json
│   │   │   │   │   ├── it.json
│   │   │   │   │   ├── ja.json
│   │   │   │   │   ├── ka.json
│   │   │   │   │   ├── ko.json
│   │   │   │   │   ├── lb.json
│   │   │   │   │   ├── lt.json
│   │   │   │   │   ├── lv.json
│   │   │   │   │   ├── mt.json
│   │   │   │   │   ├── nb_NO.json
│   │   │   │   │   ├── nl.json
│   │   │   │   │   ├── pl.json
│   │   │   │   │   ├── pt.json
│   │   │   │   │   ├── pt_BR.json
│   │   │   │   │   ├── ro.json
│   │   │   │   │   ├── ru.json
│   │   │   │   │   ├── sk.json
│   │   │   │   │   ├── sl.json
│   │   │   │   │   ├── sv.json
│   │   │   │   │   ├── th.json
│   │   │   │   │   ├── tr.json
│   │   │   │   │   ├── uk.json
│   │   │   │   │   ├── ur.json
│   │   │   │   │   ├── zh_Hans.json
│   │   │   │   │   ╰── zh_Hant.json
│   │   │   │   │
│   │   │   │   ├── __init__.py
│   │   │   │   ├── binary_sensor.py
│   │   │   │   ├── config_flow.py
│   │   │   │   ├── const.py
│   │   │   │   ├── entity.py
│   │   │   │   ├── manifest.json
│   │   │   │   ╰── switch.py
│   │   │   │
│   │   │   ╰── __init__.py
│   │   │
│   │   ├── 📁 translations/  (67 files, 1 MB)
│   │   │   ├── af.json
│   │   │   ├── ar.json
│   │   │   ├── be.json
│   │   │   ├── bg.json
│   │   │   ├── bn.json
│   │   │   ├── bs.json
│   │   │   ├── ca.json
│   │   │   ├── cs.json
│   │   │   ├── cy.json
│   │   │   ├── da.json
│   │   │   ├── de.json
│   │   │   ├── el.json
│   │   │   ├── en-GB.json
│   │   │   ├── en.json
│   │   │   ├── eo.json
│   │   │   ├── es-419.json
│   │   │   ├── es.json
│   │   │   ├── et.json
│   │   │   ├── eu.json
│   │   │   ├── fa.json
│   │   │   ├── fi.json
│   │   │   ├── fr.json
│   │   │   ├── fy.json
│   │   │   ├── ga.json
│   │   │   ├── gl.json
│   │   │   ├── gsw.json
│   │   │   ├── he.json
│   │   │   ├── hi.json
│   │   │   ├── hr.json
│   │   │   ├── hu.json
│   │   │   ├── hy.json
│   │   │   ├── id.json
│   │   │   ├── is.json
│   │   │   ├── it.json
│   │   │   ├── ja.json
│   │   │   ├── ka.json
│   │   │   ├── ko.json
│   │   │   ├── lb.json
│   │   │   ├── LICENSE.md
│   │   │   ├── lt.json
│   │   │   ├── lv.json
│   │   │   ├── mk.json
│   │   │   ├── ml.json
│   │   │   ├── mt.json
│   │   │   ├── nb.json
│   │   │   ├── nl.json
│   │   │   ├── nn.json
│   │   │   ├── pl.json
│   │   │   ├── pt-BR.json
│   │   │   ├── pt.json
│   │   │   ├── ro.json
│   │   │   ├── ru.json
│   │   │   ├── sk.json
│   │   │   ├── sl.json
│   │   │   ├── sq.json
│   │   │   ├── sr-Latn.json
│   │   │   ├── sr.json
│   │   │   ├── sv.json
│   │   │   ├── ta.json
│   │   │   ├── te.json
│   │   │   ├── th.json
│   │   │   ├── tr.json
│   │   │   ├── uk.json
│   │   │   ├── ur.json
│   │   │   ├── vi.json
│   │   │   ├── zh-Hans.json
│   │   │   ╰── zh-Hant.json
│   │   │
│   │   ├── __init__.py
│   │   ├── binary_sensor.py
│   │   ├── button.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── entity.py
│   │   ├── event.py
│   │   ├── manifest.json
│   │   ├── number.py
│   │   ├── repairs.py
│   │   ├── select.py
│   │   ├── sensor.py
│   │   ├── services.py
│   │   ├── services.yaml
│   │   ├── switch.py
│   │   ├── time.py
│   │   ╰── util.py
│   │
│   ├── 📁 stateful_scenes/  (1 folder, 10 files, 84 KB)
│   │   │
│   │   ├── 📁 translations/  (3 files, 7 KB)
│   │   │   ├── en.json
│   │   │   ├── nl.json
│   │   │   ╰── sk.json
│   │   │
│   │   ├── __init__.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── discovery.py
│   │   ├── helpers.py
│   │   ├── manifest.json
│   │   ├── number.py
│   │   ├── select.py
│   │   ├── StatefulScenes.py
│   │   ╰── switch.py
│   │
│   ├── 📁 waste_collection_schedule/  (2 folders, 14 files, 474 KB)
│   │   │
│   │   ├── 📁 translations/  (4 files, 4 MB)
│   │   │   ├── de.json
│   │   │   ├── en.json
│   │   │   ├── fr.json
│   │   │   ╰── it.json
│   │   │
│   │   ├── 📁 waste_collection_schedule/  (4 folders, 5 files, 21 KB)
│   │   │   │
│   │   │   ├── 📁 service/  (17 files, 170 KB)
│   │   │   │   ├── __init__.py
│   │   │   │   ├── A_region_ch.py
│   │   │   │   ├── AbfallIO.py
│   │   │   │   ├── AbfallnaviDe.py
│   │   │   │   ├── AppAbfallplusDe.py
│   │   │   │   ├── CitiesAppsCom.py
│   │   │   │   ├── CMCityMedia.py
│   │   │   │   ├── DeviceKeyStore.py
│   │   │   │   ├── EcoHarmonogramPL.py
│   │   │   │   ├── generate_ukbcd_json.py
│   │   │   │   ├── ICS.py
│   │   │   │   ├── InsertITDe.py
│   │   │   │   ├── junker_app.py
│   │   │   │   ├── MuellmaxDe.py
│   │   │   │   ├── Samiljo_se_wastetype_searcher.py
│   │   │   │   ├── SSLError.py
│   │   │   │   ╰── WhatBinDay.py
│   │   │   │
│   │   │   ├── 📁 source/
│   │   │   │   ├── [612 entries]
│   │   │   │
│   │   │   ├── 📁 test/  (4 files, 69 KB)
│   │   │   │   ├── recurring.ics
│   │   │   │   ├── test.ics
│   │   │   │   ├── test_sources.py
│   │   │   │   ╰── test_ukbcd.json
│   │   │   │
│   │   │   ├── 📁 wizard/  (14 files, 43 KB)
│   │   │   │   ├── __init__.py
│   │   │   │   ├── abfall_io.py
│   │   │   │   ├── abfallnavi_de.py
│   │   │   │   ├── app_abfallplus_de.py
│   │   │   │   ├── awbkoeln_de.py
│   │   │   │   ├── bsr_de.py
│   │   │   │   ├── citiesapps_com.py
│   │   │   │   ├── cmcitymedia_de.py
│   │   │   │   ├── jumomind_de.py
│   │   │   │   ├── muellmax_de.py
│   │   │   │   ├── narab_se.py
│   │   │   │   ├── stadtreinigung_hamburg.py
│   │   │   │   ├── stuttgart_de.py
│   │   │   │   ╰── wokingham_uk.py
│   │   │   │
│   │   │   ├── __init__.py
│   │   │   ├── collection.py
│   │   │   ├── collection_aggregator.py
│   │   │   ├── exceptions.py
│   │   │   ╰── source_shell.py
│   │   │
│   │   ├── __init__.py
│   │   ├── calendar.py
│   │   ├── config_flow.py
│   │   ├── const.py
│   │   ├── icons.json
│   │   ├── init_ui.py
│   │   ├── init_yaml.py
│   │   ├── manifest.json
│   │   ├── sensor.py
│   │   ├── service.py
│   │   ├── services.yaml
│   │   ├── sources.json
│   │   ├── waste_collection_api.py
│   │   ╰── wcs_coordinator.py
│   │
│   ├── 📁 webrtc/  (2 folders, 6 files, 27 KB)
│   │   │
│   │   ├── 📁 translations/  (5 files, 15 KB)
│   │   │   ├── en.json
│   │   │   ├── es.json
│   │   │   ├── fr.json
│   │   │   ├── pt.json
│   │   │   ╰── ur.json
│   │   │
│   │   ├── 📁 www/  (4 files, 58 KB)
│   │   │   ├── digital-ptz.js
│   │   │   ├── embed.html
│   │   │   ├── video-rtc.js
│   │   │   ╰── webrtc-camera.js
│   │   │
│   │   ├── __init__.py
│   │   ├── config_flow.py
│   │   ├── manifest.json
│   │   ├── media_player.py
│   │   ├── services.yaml
│   │   ╰── utils.py
│   │
│   ├── 📁 whatsapp/  (4 files, 5 KB)
│   │   ├── __init__.py
│   │   ├── manifest.json
│   │   ├── services.yaml
│   │   ╰── whatsapp.py
│   │
│   ╰── 📁 whatsapp_chat/  (3 files, 3 KB)
│       ├── __init__.py
│       ├── manifest.json
│       ╰── sensor.py
│
├── 📁 docs/  (4 folders)
│   │
│   ├── 📁 notes/  (2 files, 11 KB)
│   │   ├── gemini-prompt-manager-ui-ideas.md
│   │   ╰── log-cleanup-plan.md
│   │
│   ├── 📁 reference/  (10 folders, 4 files, 57 KB)
│   │   │
│   │   ├── 📁 Claude/  (1 file, 12 KB)
│   │   │   ╰── ha_preview_setup_guide.md
│   │   │
│   │   ├── 📁 dad_car_detection/  (1 file, 13 KB)
│   │   │   ╰── DAD_CAR_DETECTION.md
│   │   │
│   │   ├── 📁 enhy/  (1 folder)
│   │   │   │
│   │   │   ╰── 📁 enhy_bsr_numbers/  (9 files, 109 KB)
│   │   │       ├── Angel numbers master.docx
│   │   │       ├── Angel numbers master.pdf
│   │   │       ├── angel_numbers_report_summary.pdf
│   │   │       ├── bsr_extractor.py
│   │   │       ├── bsr_frequency.py
│   │   │       ├── bsr_technical_spec.md
│   │   │       ├── bsr_ui.html
│   │   │       ├── clean_angel_messages.py
│   │   │       ╰── Summary.pdf
│   │   │
│   │   ├── 📁 mpv-development/  (1 file, 9 KB)
│   │   │   ╰── mpv-development.skill
│   │   │
│   │   ├── 📁 music/  (1 file, 2 KB)
│   │   │   ╰── dancing-feet-composition.md
│   │   │
│   │   ├── 📁 pc-environment/  (4 files, 16 KB)
│   │   │   ├── claude-config.md
│   │   │   ├── network.md
│   │   │   ├── pc_environment_skill.md
│   │   │   ╰── windows.md
│   │   │
│   │   ├── 📁 prompt-engineering/  (2 files, 25 KB)
│   │   │   ├── library.md
│   │   │   ╰── SKILL.md
│   │   │
│   │   ├── 📁 shared-ui/  (1 file, 44 KB)
│   │   │   ╰── animation-handover.md
│   │   │
│   │   ├── 📁 whatsapp/  (3 files, 69 KB)
│   │   │   ├── WHATSAPP_CLAUDE_PERSPECTIVE.md
│   │   │   ├── WHATSAPP_SETUP_EXPLAINED.md
│   │   │   ╰── WHATSAPP_TECHNICAL_REFERENCE.md
│   │   │
│   │   ├── 📁 work-environment/  (2 folders, 3 files, 38 KB)
│   │   │   │
│   │   │   ├── 📁 Context/  (6 files, 125 KB)
│   │   │   │   ├── colleague_profiles.md
│   │   │   │   ├── dwp-work-context.skill
│   │   │   │   ├── dwp-work-SKILL.md
│   │   │   │   ├── minutes.md
│   │   │   │   ├── work-context-ops.md
│   │   │   │   ╰── work-context-people.md
│   │   │   │
│   │   │   ├── 📁 draft_minutes/  (2 files, 2 MB)
│   │   │   │   ├── 2026 01 15 minutes V2.pdf
│   │   │   │   ╰── min.pdf
│   │   │   │
│   │   │   ├── CLAUDE.md
│   │   │   ├── dwp-work-context.skill
│   │   │   ╰── transcript_pipeline_readme.md
│   │   │
│   │   ├── design_philosophy_reference.md
│   │   ├── lights-package-audit.md
│   │   ├── server-info-card.md
│   │   ╰── unused-integrations-audit.md
│   │
│   ├── 📁 reports/  (7 folders)
│   │   │
│   │   ├── 📁 claude-insights/  (2 folders)
│   │   │   │
│   │   │   ├── 📁 addon/  (1 file, 69 KB)
│   │   │   │   ╰── 2026-03-10_claude_code_addon_insights.html
│   │   │   │
│   │   │   ╰── 📁 desktop/  (1 file, 62 KB)
│   │   │       ╰── 2026-03-10_claude_code_desktop_insights.html
│   │   │
│   │   ├── 📁 components-review/  (1 file, 11 KB)
│   │   │   ╰── 2026-02-08-20-00-components-review.json
│   │   │
│   │   ├── 📁 config-intel/  (9 files, 305 KB)
│   │   │   ├── 2026-02-06-11-39-config-intel.md
│   │   │   ├── 2026-02-10-16-05-config-intel.md
│   │   │   ├── 2026-02-12-14-03-config-intel.md
│   │   │   ├── 2026-02-14-01-02-config-intel.md
│   │   │   ├── 2026-02-14-23-48-config-intel.md
│   │   │   ├── 2026-02-18-17-18-config-intel.md
│   │   │   ├── 2026-02-27-03-05-config-intel.md
│   │   │   ├── 2026-03-05-04-23-config-intel.md
│   │   │   ╰── 2026-03-15-10-50-config-intel.md
│   │   │
│   │   ├── 📁 failure-mode/  (2 files, 54 KB)
│   │   │   ├── FAILURE_MODE_REPORT_2026-02-01.md
│   │   │   ╰── FAILURE_MODE_REPORT_2026-03-06.md
│   │   │
│   │   ├── 📁 meta-insights/  (2 files, 45 KB)
│   │   │   ├── 2026-02-07-03-49-meta-insights.md
│   │   │   ╰── 2026-03-06-18-35-meta-insights.md
│   │   │
│   │   ├── 📁 project-audit/  (1 file, 15 KB)
│   │   │   ╰── 2026-02-14-01-38-project-audit.md
│   │   │
│   │   ╰── 📁 shared-ui-audit/  (4 files, 139 KB)
│   │       ├── 2026-02-08-04-30-shared-ui-audit.md
│   │       ├── 2026-02-10-16-02-shared-ui-audit.md
│   │       ├── 2026-02-24-21-00-shared-ui-audit.md
│   │       ╰── 2026-03-06-19-18-shared-ui-audit.md
│   │
│   ╰── 📁 research/  (7 folders)
│       │
│       ├── 📁 ai/  (9 files, 3 MB)
│       │   ├── # Deep Research Commissioning Claude's Defeatist.pdf
│       │   ├── Adversarial Seat Comparison.md
│       │   ├── Assessment of Gemini privacy.md
│       │   ├── Claude’s Defeatist Attitude Pattern_ Evidence, Mechanisms, Trajectory, and Remedies.pdf
│       │   ├── Claude’s “Defeatist Attitude” – Widespread or Just You_.pdf
│       │   ├── Gemini Privacy.md
│       │   ├── prompt research.pdf
│       │   ├── Self-Perception vs. Observed Behavior in AI-Assisted Problem Solving.pdf
│       │   ╰── The AI Trust Crisis.pdf
│       │
│       ├── 📁 apps/  (4 files, 3 MB)
│       │   ├── Deep Research Backing Conversation for session None.pdf
│       │   ├── deep-research-obsidian-app.md
│       │   ├── Investigating MV3 Video Downloader Reliability vs. CocoCut.pdf
│       │   ╰── other research.pdf
│       │
│       ├── 📁 enhy/  (3 files, 3 MB)
│       │   ├── Claude Research.pdf
│       │   ├── Enhy clinic ChatGPT Research.pdf
│       │   ╰── Ken Honda’s Money Mindset and Philosophy.pdf
│       │
│       ├── 📁 personal_device/  (1 file, 14 KB)
│       │   ╰── Windows 11 PC Rebuild Guide.md
│       │
│       ├── 📁 smart_home/  (1 file, 1 MB)
│       │   ╰── Research multi-sensor occupancy detection systems,.pdf
│       │
│       ├── 📁 ui_design/  (3 files, 315 KB)
│       │   ├── Designing an Effective Universal Personal Dashboard.pdf
│       │   ├── shared_ui_spec.pdf
│       │   ╰── UI progress update.pdf
│       │
│       ╰── 📁 work/  (4 files, 317 KB)
│           ├── exec_dysfunction_reference.md
│           ├── Executive Dysfunction Reference Document for Workplace Use in the UK Civil Service.pdf
│           ├── What medication does and does not do for executive dysfunction.pdf
│           ╰── When workplace adjustments fail - enforcement and escalation in UK employment law.pdf
│
├── 📁 packages/  (14 folders)
│   │
│   ├── 📁 ai/  (9 files, 37 KB)
│   │   ├── ai_main.yaml
│   │   ├── ai_system_prompts.yaml
│   │   ├── alexa.yaml
│   │   ├── CLAUDE.md
│   │   ├── claude_bridge.yaml
│   │   ├── generate_images.yaml
│   │   ├── generate_text.yaml
│   │   ├── prompt_manager.yaml
│   │   ╰── rota_upload.yaml
│   │
│   ├── 📁 communication/  (7 files, 51 KB)
│   │   ├── activity_alerts.yaml
│   │   ├── alerts.yaml
│   │   ├── c_whatsapp_auto_reply.yaml
│   │   ├── CLAUDE.md
│   │   ├── transcript_pipeline.yaml
│   │   ├── whatsapp_config.yaml
│   │   ╰── whatsapp_e.yaml
│   │
│   ├── 📁 dashboard/  (2 files, 12 KB)
│   │   ├── CLAUDE.md
│   │   ╰── report_viewer.yaml
│   │
│   ├── 📁 device/  (11 files, 57 KB)
│   │   ├── cameras.yaml
│   │   ├── CLAUDE.md
│   │   ├── curtains.yaml
│   │   ├── driveway_detection.yaml
│   │   ├── govee.yaml
│   │   ├── mobile_device.yaml
│   │   ├── pc.yaml
│   │   ├── pet_devices.yaml
│   │   ├── phone_control.yaml
│   │   ├── sonos.yaml
│   │   ╰── structure.yaml
│   │
│   ├── 📁 health/  (3 files, 18 KB)
│   │   ├── CLAUDE.md
│   │   ├── health.yaml
│   │   ╰── weight.yaml
│   │
│   ├── 📁 lights/  (6 files, 32 KB)
│   │   ├── auto_lights.yaml
│   │   ├── CLAUDE.md
│   │   ├── lights.yaml
│   │   ├── lights2.yaml
│   │   ├── lights_bedroom.yaml
│   │   ╰── lights_office.yaml
│   │
│   ├── 📁 network/  (2 files, 8 KB)
│   │   ├── CLAUDE.md
│   │   ╰── ip_and_mac_address_mapping.yaml
│   │
│   ├── 📁 occupancy/  (7 files, 86 KB)
│   │   ├── bed_state.yaml
│   │   ├── CLAUDE.md
│   │   ├── doors.yaml
│   │   ├── floor02_travel_tracking.yaml
│   │   ├── presence_activity_card.yaml
│   │   ├── presence_desks.yaml
│   │   ╰── presence_detection.yaml
│   │
│   ├── 📁 server/  (1 folder, 3 files, 21 KB)
│   │   │
│   │   ├── 📁 frontend/  (10 files, 66 KB)
│   │   │   ├── advanced_camera_card_backend.yaml
│   │   │   ├── bubble_modules.yaml
│   │   │   ├── daily_affirmation.yaml
│   │   │   ├── frontend_animated_header_cycle.yaml
│   │   │   ├── frontend_auto_refresh.yaml
│   │   │   ├── frontend_dad_joke.yaml
│   │   │   ├── frontend_server_stats.yaml
│   │   │   ├── frontend_tester_entities.yaml
│   │   │   ├── frontend_theme_management.yaml
│   │   │   ╰── frontend_tts_setup.yaml
│   │   │
│   │   ├── CLAUDE.md
│   │   ├── github_sync.yaml
│   │   ╰── ha_snapshot_sensor.yaml
│   │
│   ├── 📁 shopping/  (3 files, 19 KB)
│   │   ├── CLAUDE.md
│   │   ├── shopping_list.yaml
│   │   ╰── tesco_sensors.yaml
│   │
│   ├── 📁 time/  (5 files, 22 KB)
│   │   ├── alarm_time.yaml
│   │   ├── calendar_frontend_add_event.yaml
│   │   ├── CLAUDE.md
│   │   ├── hourly_triggers.yaml
│   │   ╰── time.yaml
│   │
│   ├── 📁 travel/  (3 files, 11 KB)
│   │   ├── CLAUDE.md
│   │   ├── map.yaml
│   │   ╰── railway.yaml
│   │
│   ├── 📁 weather/  (2 files, 20 KB)
│   │   ├── CLAUDE.md
│   │   ╰── frontend_weather.yaml
│   │
│   ╰── 📁 work/  (3 files, 12 KB)
│       ├── CLAUDE.md
│       ├── work.yaml
│       ╰── work_actions_card.yaml
│
├── 📁 pyscript/  (12 files, 109 KB)
│   ├── action_extraction_pipeline.py
│   ├── cleanup_duplicate_work_events.py
│   ├── dad_car_detection.py
│   ├── delete_work_events_for_dates.py
│   ├── delete_work_events_on_date.py
│   ├── dump_log_breakdown.py
│   ├── log_errors.py
│   ├── recorder_stats.py
│   ├── save_rota_image.py
│   ├── save_uploaded_file.py
│   ├── system_context.py
│   ╰── theme_sync.py
│
├── 📁 python_scripts/
│
├── 📁 scripts/  (2 files, 7 KB)
│   ├── fetch_imap_attachments.py
│   ╰── fetch_transcript.sh
│
├── 📁 templates/  (1 folder, 1 file, 35 KB)
│   │
│   ├── 📁 custom_button_card_templates/  (3 folders, 10 files, 87 KB)
│   │   │
│   │   ├── 📁 animations/  (11 files, 36 KB)
│   │   │   ├── alert_animation_bounce.yaml
│   │   │   ├── icon_chandelier.yaml
│   │   │   ├── icon_desk_lamp.yaml
│   │   │   ├── icon_garage.yaml
│   │   │   ├── icon_garage2.yaml
│   │   │   ├── icon_lock.yaml
│   │   │   ├── icon_pendant.yaml
│   │   │   ├── icon_porch.yaml
│   │   │   ├── icon_recessed.yaml
│   │   │   ├── start_animation_popup.yaml
│   │   │   ╰── start_animation_shake.yaml
│   │   │
│   │   ├── 📁 olympus_cards/  (16 folders, 1 file, 4 KB)
│   │   │   │
│   │   │   ├── 📁 animated_header_card/  (1 file, 9 KB)
│   │   │   │   ╰── animated_header_card.yaml
│   │   │   │
│   │   │   ├── 📁 animated_name/  (1 file, 1 KB)
│   │   │   │   ╰── animated_name.yaml
│   │   │   │
│   │   │   ├── 📁 animated_nav_tile/  (1 file, 5 KB)
│   │   │   │   ╰── animated_nav_tile.yaml
│   │   │   │
│   │   │   ├── 📁 calendar_widget/  (1 file, 28 KB)
│   │   │   │   ╰── calendar_widget.yaml
│   │   │   │
│   │   │   ├── 📁 cam_circle_control/  (1 file, 13 KB)
│   │   │   │   ╰── cam_circle_control.yaml
│   │   │   │
│   │   │   ├── 📁 daily_affirmation_card/  (1 file, 15 KB)
│   │   │   │   ╰── daily_affirmation_card.yaml
│   │   │   │
│   │   │   ├── 📁 divider/  (1 file, 6 KB)
│   │   │   │   ╰── divider.yaml
│   │   │   │
│   │   │   ├── 📁 light_dropdown_pill/  (1 file, 8 KB)
│   │   │   │   ╰── light_dropdown_pill.yaml
│   │   │   │
│   │   │   ├── 📁 light_pill/  (1 file, 5 KB)
│   │   │   │   ╰── light_pill.yaml
│   │   │   │
│   │   │   ├── 📁 rotating_messages_card/  (1 file, 5 KB)
│   │   │   │   ╰── rotating_messages_card.yaml
│   │   │   │
│   │   │   ├── 📁 specs_card/  (1 file, 22 KB)
│   │   │   │   ╰── specs_card.yaml
│   │   │   │
│   │   │   ├── 📁 sun_position_card/  (1 file, 8 KB)
│   │   │   │   ╰── sun_position_card.yaml
│   │   │   │
│   │   │   ├── 📁 system_metrics_card/  (1 file, 14 KB)
│   │   │   │   ╰── system_metrics_card.yaml
│   │   │   │
│   │   │   ├── 📁 theme_swatch_card/  (1 file, 10 KB)
│   │   │   │   ╰── theme_swatch.yaml
│   │   │   │
│   │   │   ├── 📁 weather_info_card/  (1 file, 21 KB)
│   │   │   │   ╰── weather_info_card.yaml
│   │   │   │
│   │   │   ├── 📁 weather_week_forecast/  (1 file, 25 KB)
│   │   │   │   ╰── weather_7_day_forecast.yaml
│   │   │   │
│   │   │   ╰── blank_template.yaml
│   │   │
│   │   ├── 📁 rounded_theme_templates/  (1 folder)
│   │   │   │
│   │   │   ╰── 📁 templates/  (1 folder, 22 files, 35 KB)
│   │   │       │
│   │   │       ├── 📁 base/  (1 folder, 6 files, 13 KB)
│   │   │       │   │
│   │   │       │   ├── 📁 languages/  (1 file, 425 bytes)
│   │   │       │   │   ╰── rounded_de-de.yaml
│   │   │       │   │
│   │   │       │   ├── rounded_background_color.yaml
│   │   │       │   ├── rounded_base.yaml
│   │   │       │   ├── rounded_button_single.yaml
│   │   │       │   ├── rounded_extra_status.yaml
│   │   │       │   ├── rounded_pill.yaml
│   │   │       │   ╰── rounded_state_engine.yaml
│   │   │       │
│   │   │       ├── rounded_alarm.yaml
│   │   │       ├── rounded_back_button.yaml
│   │   │       ├── rounded_brightness.yaml
│   │   │       ├── rounded_button_light.yaml
│   │   │       ├── rounded_button_light_slider.yaml
│   │   │       ├── rounded_button_script.yaml
│   │   │       ├── rounded_calendar.yaml
│   │   │       ├── rounded_caption.yaml
│   │   │       ├── rounded_conditions.yaml
│   │   │       ├── rounded_graph.yaml
│   │   │       ├── rounded_input_boolean.yaml
│   │   │       ├── rounded_input_number.yaml
│   │   │       ├── rounded_media_player.yaml
│   │   │       ├── rounded_nina_warnings.yaml
│   │   │       ├── rounded_party_mode.yaml
│   │   │       ├── rounded_person.yaml
│   │   │       ├── rounded_room.yaml
│   │   │       ├── rounded_scene.yaml
│   │   │       ├── rounded_sensor.yaml
│   │   │       ├── rounded_title_card.yaml
│   │   │       ├── rounded_title_card_badge.yaml
│   │   │       ╰── rounded_weather_pill.yaml
│   │   │
│   │   ├── extension_lead.yaml
│   │   ├── light_card.yaml
│   │   ├── light_popup.yaml
│   │   ├── light_slider.yaml
│   │   ├── nav_button.yaml
│   │   ├── page_header.yaml
│   │   ├── plug_extension.yaml
│   │   ├── plug_stats.yaml
│   │   ├── profile_card.yaml
│   │   ╰── temp_light.yaml
│   │
│   ╰── decluttering-card.yaml
│
├── 📁 themes/  (6 folders, 7 files, 114 KB)
│   │
│   ├── 📁 bubble/  (1 file, 8 KB)
│   │   ╰── bubble.yaml
│   │
│   ├── 📁 catppuccin/  (1 file, 174 KB)
│   │   ╰── catppuccin.yaml
│   │
│   ├── 📁 material_you/  (1 file, 42 KB)
│   │   ╰── material_you.yaml
│   │
│   ├── 📁 Neon/  (1 file, 17 KB)
│   │   ╰── neon.yaml
│   │
│   ├── 📁 Rounded/  (1 file, 17 KB)
│   │   ╰── rounded.yaml
│   │
│   ├── 📁 visionos/  (2 files, 18 KB)
│   │   ├── Liquid Glass.yaml
│   │   ╰── visionos.yaml
│   │
│   ├── hacasa.yaml
│   ├── hacasa_gold.yaml
│   ├── hacasa_peach.yaml
│   ├── olympus.yaml
│   ├── rounded-alt-2.yaml
│   ├── tablet.yaml
│   ╰── test_theme.yaml
│
├── 📁 tmp/  (3 files, 116 KB)
│   ├── action-extraction-implementation-spec.md
│   ├── action-extraction-plan-v2.1-final.md
│   ╰── action_extraction_pipeline.py
│
├── 📁 ui/  (1 folder, 4 files, 19 KB)
│   │
│   ├── 📁 views/  (9 files, 317 KB)
│   │   ├── home.yaml
│   │   ├── lights.yaml
│   │   ├── pets.yaml
│   │   ├── power.yaml
│   │   ├── shopping.yaml
│   │   ├── splash.yaml
│   │   ├── tester.yaml
│   │   ├── weather.yaml
│   │   ╰── window.yaml
│   │
│   ├── custom_more_info.yaml
│   ├── decluttering_templates.yaml
│   ├── frontend_extra_modules.yaml
│   ╰── ui_lovelace_resources.yaml
│
├── 📁 uploads/  (4 files, 168 KB)
│   ├── 20251118_185625_ha_index_addons.csv
│   ├── 20251118_185706_ha_index_addons.csv
│   ├── 20251118_190823_ha_index_addons.csv
│   ╰── 20251211_231709_Designing_an_Effective_Universal_Personal_Dashboard.pdf
│
├── ARCHITECTURE.md
├── automations.yaml
├── CLAUDE.md
├── configuration.yaml
├── example.yaml
├── extract_js.py
├── frigate_config_v2.yml
├── go2rtc-1.9.9
├── ip_bans.yaml
├── README.md
├── scenes.yaml
├── scripts.yaml
├── system_context.yaml
╰── ui-lovelace.yaml
```
