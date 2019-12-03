/**
 * Defines a building in the D!BS system
 */
class DibsBuilding {

    building_id;
    description;
    latitude;
    longitude;
    name;
    picture_url;
    rooms;

    /**
     * Creates a building in the system
     * @param building_id The ID of the building
     * @param description The description of the building, if available
     * @param latitude The latitude coordinate of the building on a map
     * @param longitude The longitude coordinate of the building on a map
     * @param name The name of the building
     * @param picture_url The URL of the thumbnail showing the building
     */
    constructor( building_id, description, latitude, longitude, name, picture_url ) {
        this.building_id = building_id;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.name = name;
        this.picture_url = picture_url;
        this.rooms = [];
    }

    /**
     * The integer ID of the building
     * @returns {*}
     */
    getID() {
        return this.building_id;
    }

    /**
     * The description of the building, if available
     * @returns {*}
     */
    getDescription() {
        return this.description;
    }

    /**
     * The latitude and longitude of the building
     * @returns {{lon: *, lat: *}}
     */
    getCoordiates() {
        return {
            lat: this.latitude,
            lon: this.longitude
        }
    }

    /**
     * The name of the building
     * @returns {*}
     */
    getName() {
        return this.name;
    }

    /**
     * The URL of the thumbnail showing the building
     * @returns {*}
     */
    getPictureURL() {
        return this.picture_url;
    }

    /**
     * An array of DibsRoom within this building
     * @returns {*}
     */
    getRooms() {
        return this.rooms;
    }

    /**
     * Adds a DibsRoom under this building. The room must have this building set as its building first
     * @param room The DibsRoom that belongs in the building
     */
    addRoom( room ) {
        if( room.getBuildingID() === this.getID() )
            this.rooms.push( room )
    }
}

module.exports = DibsBuilding;