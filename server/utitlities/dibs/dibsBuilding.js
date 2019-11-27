// Building in the D!BS system
class DibsBuilding {

    building_id;
    description;
    latitude;
    longitude;
    name;
    picture_url;
    rooms;

    constructor( building_id, description, latitude, longitude, name, picture_url ) {
        this.building_id = building_id;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.name = name;
        this.picture_url = picture_url;
        this.rooms = [];
    }

    getID() {
        return this.building_id;
    }

    getDescription() {
        return this.description;
    }

    getCoordiates() {
        return {
            lat: this.latitude,
            lon: this.longitude
        }
    }

    getName() {
        return this.name;
    }

    getPictureURL() {
        return this.picture_url;
    }

    getRooms() {
        return this.rooms;
    }

    addRoom( room ) {
        this.rooms.push( room )
    }
}

module.exports = DibsBuilding;