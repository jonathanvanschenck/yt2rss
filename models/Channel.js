
class Channel {
    constructor({
        id = null,
        identifier = '',
        url = '',
        title = '',
        description = '',
        author = '',
        published = null
    }) {
        this.id = id;
        this.identifier = identifier;
        this.url = url;
        this.title = title;
        this.description = description;
        this.author = author;
        this.published = published;
    }

    to_api() {
        return {
            id : this.id,
            identifier : this.identifier,
            url : this.url,
            title : this.title,
            description : this.description,
            author : this.author,
            published : this.published
        }
    }

    static from_db_row(row) {
        return new this({
            id : +row.id,
            identifier : row.identifier,
            url : row.url,
            title : row.title,
            description : row.description,
            author : row.author,
            published : row.published ? new Date(row.published) : null,
        })
    }

    static async all(db) {
        let [ results ] = await db.query('SELECT * FROM `channels`');
        return results.map(r => this.from_db_row(r));
    }

    static async one(db, identifier) {
        let query;
        if ( isNaN(parseInt(identifier)) ) {
            query = 'SELECT * FROM `channels` WHERE `identifier` = ?'
        } else {
            query = 'SELECT * FROM `channels` WHERE `id` = ?'
        }
        let [ results ] = await db.query(query, [identifier]);
        if ( !results || results.length < 1 ) return null;
        return this.from_db_row(results[0]);
    }

    async save(db) {
        let [ results ] = await db.query(
            `INSERT INTO \`channels\`
                (\`identifier\`, \`url\`,  \`title\`, \`description\`, \`author\`, \`published\`)
            VALUES
                (?,?,?,?,?,?)`,
            [this.identifier, this.url, this.title, this.description, this.author, this.published]
        )
        if ( !(results[0] && results[0].insertId) ) return null;
        let new_self = this.one(db, results[0].insertId);
        if ( !new_self ) return null;
        return this.merge(new_self);
    }

    async update(db) {
        let [ results ] = await db.query(
            `UPDATE \`channels\` SET
                \`url\` = ?,
                \`title\` = ?,
                \`description\` = ?,
                \`author\` = ?,
                \`published\` = ?
            WHERE \`identifier\` = ?`,
            [this.url, this.title, this.description, this.author, this.published, this.identifier]
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
        if ( isNaN(parseInt(identifier)) ) {
            query = 'DELETE FROM `channels` WHERE `identifier` = ?'
        } else {
            query = 'DELETE FROM `channels` WHERE `id` = ?'
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

module.exports = exports = Channel;
