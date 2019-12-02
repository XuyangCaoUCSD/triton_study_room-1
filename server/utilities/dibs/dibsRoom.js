/**
 * Defines a room in the D!BS system
 */
class DibsRoom {

    building;
    description;
    name;
    picture_url;
    room_id;

    /**
     * Creates the DibsRoom
     * @param building The DibsBuilding containing this room
     * @param description The description of the room, if available
     * @param name The name of the room
     * @param picture_url The URL containing the thumbnail for the room
     * @param room_id The room's integer ID
     */
    constructor( building, description, name, picture_url, room_id ) {
        this.building = building;
        this.description = description;
        this.name = name;
        this.picture_url = picture_url;
        this.room_id = room_id;
    }

    /**
     * The integer ID for this room
     * @returns {*}
     */
    getID() {
        return this.room_id;
    }

    /**
     * The URL of the thumbnail for this room
     * @returns {*}
     */
    getPictureURL() {
        return this.picture_url;
    }

    /**
     * The name of the room
     * @returns {*}
     */
    getName() {
        return this.name;
    }

    /**
     * The description of the room
     * @returns {*}
     */
    getDescription() {
        return this.description;
    }

    /**
     * The building containing this room
     * @returns {*}
     */
    getBuilding() {
        return this.building;
    }
}

module.exports = DibsRoom;