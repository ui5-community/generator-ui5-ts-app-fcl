const { URL } = require("url");

const axios = require("axios");
const X2JS = require("x2js");

function ensureArray(value) {
    if (value && !Array.isArray(value)) {
        return [ value ];
    } else {
        return value;
    }
}

module.exports = {

    isValidUrl(url, protocols) {
        try {
            const parsedUrl = new URL(url);
            if (Array.isArray(protocols)) {
                const regexSupported = new RegExp(`^(${protocols.join("|")}):`, 'gi');
                return regexSupported.test(url);
            }
            return true;
        } catch (err) {
            return false;
        }
    },

    ODataMetadata: class ODataMetadata {

        constructor(serviceMetadata) {

            this.serviceMetadata = serviceMetadata;

            const schemas = ensureArray(this.serviceMetadata["Edmx"]["DataServices"]["Schema"]);

            this.entityTypes = {};
            schemas.forEach(schema => {
                ensureArray(schema.EntityType)?.forEach(entityType => {
                    let keys = entityType.Key?.PropertyRef;
                    if (!Array.isArray(keys)) {
                        keys = [keys];
                    }
                    this.entityTypes[`${schema.Namespace}.${entityType.Name}`] = {
                        namespace: schema.Namespace,
                        name: entityType.Name,
                        keys: ensureArray(entityType.Key?.PropertyRef)?.map(key => {
                            return key.Name;
                        }),
                        properties: ensureArray(entityType.Property.map(prop => {
                            return {
                                name: prop.Name,
                                type: prop.Type
                            };
                        }))
                    };
                });
            });

            this.entitySets = {};
            schemas.forEach(schema => {
                ensureArray(schema.EntityContainer?.EntitySet)?.forEach(entitySet => {
                    this.entitySets[entitySet.Name] = this.entityTypes[entitySet.EntityType];
                });
            });
            // console.log(JSON.stringify(this.entitySets, null, 2));

        }

        static async load(serviceUrl) {
            try {
                // keep the reference to the
                this.serviceUrl = new URL(serviceUrl);
                // load the service metadata
                const response = await axios.get(`${this.serviceUrl.toString()}$metadata`);
                const serviceMetadata = new X2JS({
                    attributePrefix: ""
                }).xml2js(response.data);
                // create and return a new ODataMetadata instance
                return new ODataMetadata(serviceMetadata);
            } catch (err) {
                if (err.response?.status === 404) {
                    console.log(`Failed to load the service metadata ${err.response.config.url}: ${err.response.statusText}`);
                } else {
                    console.error(err);
                }
            }
        }

        getEntitySets() {
            return Object.keys(this.entitySets).sort();
        }

        getEntitySet(name) {
            return this.entitySets[name];
        }

        getKeys(entitySet) {
            return this.getEntitySet(entitySet).keys;
        }

        getProperties(entitySet) {
            return this.getEntitySet(entitySet).properties.map(prop => {
                return prop.name;
            });
        }

    }

};
