
class MP3 {
    constructor({
        id = null,
        identifier = '',
        channel_identifier = '',
        title = '',
        description = '',
        author = '',
        published = null,
        length = 0,
        duration = 0,
        created = null,
        expires = null
    }) {
        this.id = id;
        this.identifier = identifier;
        this.channel_identifier = channel_identifier;
        this.title = title;
        this.description = description;
        this.author = author;
        this.published = published;
        this.length = length;
        this.duration = duration;
        this.created = created;
        this.expires = expires;
    }

    to_api() {
        return {
            id : this.id,
            identifier : this.identifier,
            channel_identifier : this.channel_identifier,
            title : this.title,
            description : this.description,
            author : this.author,
            published : this.published,
            length : this.length,
            duration : this.duration,
            created : this.created,
            expires : this.expires
        }
    }

    static from_db_row(row) {
        return new this({
            id : +row.id,
            identifier : row.identifier,
            channel_identifier : row.channel_identifier,
            title : row.title,
            description : row.description,
            author : row.author,
            published : row.published ? new Date(row.published) : null,
            length : +row.length,
            duration : +row.duration,
            created : row.created ? new Date(row.created) : null,
            expires : row.expires ? new Date(row.expires) : null,
        })
    }

    static async all(db, channel_identifier) {
        let query;
        let params = [];
        if ( channel_identifier ) {
            query = 'SELECT * FROM `mp3s` where `channel_identifier` = ?' ;
            params.push(channel_identifier);
        } else {
            query = 'SELECT * FROM `mp3s`' ;
        }
        let [ results ] = await db.query(query,params);
        return results.map(r => this.from_db_row(r));
    }

    static async unexpired(db) {
        let [ results ] = await db.query('SELECT * FROM `mp3s` WHERE \`expires\` > NOW()');
        return results.map(r => this.from_db_row(r));
    }

    static async one(db, identifier) {
        let query;
        if ( isNaN(parseInt(identifier)) ) {
            query = 'SELECT * FROM `mp3s` WHERE `identifier` = ?'
        } else {
            query = 'SELECT * FROM `mp3s` WHERE `id` = ?'
        }
        let [ results ] = await db.query(query, [identifier]);
        if ( !results || results.length < 1 ) return null;
        return this.from_db_row(results[0]);
    }

    async save(db) {
        let [ results ] = await db.query(
            `INSERT INTO \`mp3s\`
                (\`identifier\`, \`channel_identifier\`,  \`title\`, \`description\`, \`author\`, \`published\`, \`length\`, \`duration\`, \`created\`, \`expires\`)
            VALUES
                (?,?,?,?,?,?,?,?,?,?)`,
            [this.identifier, this.channel_identifier, this.title, this.description, this.author, this.published, this.length, this.duration, this.created, this.expires]
        )
        if ( !(results[0] && results[0].insertId) ) return null;
        let new_self = this.one(db, results[0].insertId);
        if ( !new_self ) return null;
        return this.merge(new_self);
    }

    async update(db) {
        let [ results ] = await db.query(
            `UPDATE \`mp3s\` SET
                \`channel_identifier\` = ?,
                \`title\` = ?,
                \`description\` = ?,
                \`author\` = ?,
                \`published\` = ?,
                \`length\` = ?,
                \`duration\` = ?,
                \`created\` = ?,
                \`expires\` = ?
            WHERE \`identifier\` = ?`,
            [this.channel_identifier, this.title, this.description, this.author, this.published, this.length, this.duration, this.created, this.expires, this.identifier]
        )
        if ( !(results[0] && results[0].affectedRows > 0) ) return null;
        let new_self = this.one(db, this.id);
        if ( !new_self ) return null;
        return this.merge(new_self);
    }

    async delete(db) {
        return this.constructor.delete(db, this.identifier);
    }
    static async delete(db, identifier) {
        let query;
        if ( isNaN(parseInt(identifier)) || typeof(identifier) === "string" ) {
            query = 'DELETE FROM `mp3s` WHERE `identifier` = ?'
        } else {
            query = 'DELETE FROM `mp3s` WHERE `id` = ?'
        }
        let [ results ] = await db.query(query, [identifier]);
        if ( !(results[0] && results[0].affectedRows > 0) ) return null;
        return true;
    }

    merge(other) {
        Object.assign(this, other);
        return this;
    }
}

module.exports = exports = MP3;
