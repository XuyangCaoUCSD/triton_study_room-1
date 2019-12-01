// Room in the D!BS system
class DibsRoom {

    building;
    description;
    name;
    picture_url;
    room_id;

    constructor( building, description, name, picture_url, room_id ) {
        this.building = building;
        this.description = description;
        this.name = name;
        this.picture_url = picture_url;
        this.room_id = room_id;
    }

    getID() {
        return this.room_id;
    }

    getPictureURL() {
        return this.picture_url;
    }

    getName() {
        return this.name;
    }

    getDescription() {
        return this.description;
    }

    getBuilding() {
        return this.building;
    }

    getHours( year, month, day ) {

    }
}

module.exports = DibsRoom;