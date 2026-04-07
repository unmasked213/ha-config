// /config/www/cards/presence-activity-card/floor-resolver.js
// Floor and Area resolution via Home Assistant WebSocket API
// Caches floor/area relationships for the session lifetime

/**
 * FloorResolver
 * 
 * Resolves area IDs to floor metadata using HA's registry APIs.
 * Caches results since floor/area relationships are stable during a session.
 * 
 * Usage:
 *   const resolver = new FloorResolver(hass);
 *   await resolver.initialize();
 *   const floorInfo = resolver.getFloorForArea('bedroom_2');
 *   // { floorId: 'floor_02', name: 'Floor 02', level: 2, color: 'hsl(200, 70%, 50%)' }
 */
export class FloorResolver {
  constructor(hass) {
    this._hass = hass;
    this._initialized = false;

    // Caches
    this._areas = new Map();      // area_id → { name, floor_id, ... }
    this._floors = new Map();     // floor_id → { name, level, icon, ... }
    this._floorColors = new Map(); // floor_id → hsl color string
    this._entities = new Map();   // entity_id → { area_id, device_id, ... }
    
    // Config
    this._baseHue = 200;          // Default accent-ish hue
    this._hueIncrement = 45;      // Rotation per floor level
    this._saturation = 70;
    this._lightness = 50;
  }

  /**
   * Initialize resolver by fetching area and floor registries
   * Call once after hass is available, before any lookups
   */
  async initialize() {
    if (this._initialized) return;

    try {
      // Fetch all registries in parallel
      const [areas, floors, entities, devices] = await Promise.all([
        this._fetchAreaRegistry(),
        this._fetchFloorRegistry(),
        this._fetchEntityRegistry(),
        this._fetchDeviceRegistry()
      ]);

      // Build device map for entity→area fallback (via device)
      const deviceAreaMap = new Map();
      for (const device of devices) {
        if (device.area_id) {
          deviceAreaMap.set(device.id, device.area_id);
        }
      }

      // Build entity map (entity can have area directly, or inherit from device)
      for (const entity of entities) {
        const areaId = entity.area_id || deviceAreaMap.get(entity.device_id) || null;
        this._entities.set(entity.entity_id, {
          entityId: entity.entity_id,
          areaId: areaId,
          deviceId: entity.device_id || null
        });
      }
      
      // Build area map
      for (const area of areas) {
        this._areas.set(area.area_id, {
          areaId: area.area_id,
          name: area.name,
          floorId: area.floor_id || null,
          icon: area.icon || null,
          aliases: area.aliases || []
        });
      }
      
      // Build floor map and generate colors
      const sortedFloors = floors.sort((a, b) => (a.level || 0) - (b.level || 0));
      
      for (let i = 0; i < sortedFloors.length; i++) {
        const floor = sortedFloors[i];
        this._floors.set(floor.floor_id, {
          floorId: floor.floor_id,
          name: floor.name,
          level: floor.level ?? i,
          icon: floor.icon || null,
          aliases: floor.aliases || []
        });
        
        // Generate floor color via HSL rotation
        const hue = (this._baseHue + (floor.level ?? i) * this._hueIncrement) % 360;
        this._floorColors.set(floor.floor_id, `hsl(${hue}, ${this._saturation}%, ${this._lightness}%)`);
      }
      
      this._initialized = true;
      
    } catch (error) {
      console.error('[FloorResolver] Failed to initialize:', error);
      this._initialized = false;
      throw error;
    }
  }

  /**
   * Fetch area registry via WebSocket
   */
  _fetchAreaRegistry() {
    return this._hass.connection.sendMessagePromise({
      type: 'config/area_registry/list'
    });
  }

  /**
   * Fetch floor registry via WebSocket
   */
  _fetchFloorRegistry() {
    return this._hass.connection.sendMessagePromise({
      type: 'config/floor_registry/list'
    });
  }

  /**
   * Fetch entity registry via WebSocket
   */
  _fetchEntityRegistry() {
    return this._hass.connection.sendMessagePromise({
      type: 'config/entity_registry/list'
    });
  }

  /**
   * Fetch device registry via WebSocket
   */
  _fetchDeviceRegistry() {
    return this._hass.connection.sendMessagePromise({
      type: 'config/device_registry/list'
    });
  }

  /**
   * Get floor information for an area
   * @param {string} areaId - The area_id (e.g., 'bedroom_2')
   * @returns {Object|null} Floor info or null if not found/no floor assigned
   */
  getFloorForArea(areaId) {
    if (!this._initialized) {
      console.warn('[FloorResolver] Not initialized. Call initialize() first.');
      return null;
    }
    
    const area = this._areas.get(areaId);
    if (!area || !area.floorId) {
      return null;
    }
    
    const floor = this._floors.get(area.floorId);
    if (!floor) {
      return null;
    }
    
    return {
      ...floor,
      color: this._floorColors.get(area.floorId) || null
    };
  }

  /**
   * Get area information
   * @param {string} areaId - The area_id
   * @returns {Object|null} Area info or null if not found
   */
  getArea(areaId) {
    return this._areas.get(areaId) || null;
  }

  /**
   * Get area ID for an entity (via entity or device assignment)
   * @param {string} entityId - The entity_id
   * @returns {string|null} Area ID or null if not assigned
   */
  getAreaIdForEntity(entityId) {
    const entity = this._entities.get(entityId);
    return entity?.areaId || null;
  }

  /**
   * Get floor information for an entity
   * @param {string} entityId - The entity_id
   * @returns {Object|null} Floor info or null if not found/no floor assigned
   */
  getFloorForEntity(entityId) {
    const areaId = this.getAreaIdForEntity(entityId);
    if (!areaId) return null;
    return this.getFloorForArea(areaId);
  }

  /**
   * Get all entity IDs in a given area matching a domain prefix
   * @param {string} areaId - The area_id to search
   * @param {string} domainPrefix - Entity domain prefix (e.g., 'light.')
   * @returns {string[]} Matching entity IDs
   */
  getEntityIdsInArea(areaId, domainPrefix) {
    const results = [];
    for (const [entityId, entityInfo] of this._entities) {
      if (entityInfo.areaId === areaId && entityId.startsWith(domainPrefix)) {
        results.push(entityId);
      }
    }
    return results;
  }

  /**
   * Get all floors sorted by level
   * @returns {Array} Array of floor objects with colors
   */
  getAllFloors() {
    return Array.from(this._floors.values())
      .sort((a, b) => a.level - b.level)
      .map(floor => ({
        ...floor,
        color: this._floorColors.get(floor.floorId)
      }));
  }

  /**
   * Override floor color (from settings)
   * @param {string} floorId - Floor ID to override
   * @param {string} color - CSS color string
   */
  setFloorColor(floorId, color) {
    if (this._floors.has(floorId)) {
      this._floorColors.set(floorId, color);
    }
  }

  /**
   * Configure HSL generation parameters
   * @param {Object} config - { baseHue, hueIncrement, saturation, lightness }
   */
  configureColors(config) {
    if (config.baseHue !== undefined) this._baseHue = config.baseHue;
    if (config.hueIncrement !== undefined) this._hueIncrement = config.hueIncrement;
    if (config.saturation !== undefined) this._saturation = config.saturation;
    if (config.lightness !== undefined) this._lightness = config.lightness;
    
    // Regenerate colors if already initialized
    if (this._initialized) {
      for (const [floorId, floor] of this._floors) {
        const hue = (this._baseHue + floor.level * this._hueIncrement) % 360;
        this._floorColors.set(floorId, `hsl(${hue}, ${this._saturation}%, ${this._lightness}%)`);
      }
    }
  }

  /**
   * Check if resolver is ready
   */
  get isInitialized() {
    return this._initialized;
  }

  /**
   * Force re-initialization (e.g., after areas/floors change)
   */
  async refresh() {
    this._initialized = false;
    this._areas.clear();
    this._floors.clear();
    this._floorColors.clear();
    this._entities.clear();
    await this.initialize();
  }
}
