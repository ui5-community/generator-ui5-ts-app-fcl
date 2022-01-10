# generator-ui5-ts-app-fcl

[![License Status][license-image]][license-url]

Generator which use the official UI5 tooling and support multiple deployment targets such as the SAP Business Technology Platform. This generator was build as a plug-in for the community project [Easy-UI5](https://github.com/SAP/generator-easy-ui5/) by [SAP](https://github.com/SAP/).

## Usage with easy-ui5

```bash
$> npm i -g yo
$> yo easy-ui5 ts-app-fcl

     _-----_
    |       |    ╭──────────────────────────╮
    |--(o)--|    │  Welcome to the easy-ui5 │
   `---------´   │        generator!        │
    ( _´U`_ )    ╰──────────────────────────╯
    /___A___\   /
     |  ~  |
   __'.___.'__
 ´   `  |° ´ Y `
```

After the generation of your project you can use `npm start` (or `yarn start`) to start the local development server.

## Standalone usage

Note the different greeting when the generator starts:

```bash
$> npm i -g yo
$> yo ./generator-ui5-ts-app-fcl

     _-----_     ╭──────────────────────────╮
    |       |    │    Welcome to the        │
    |--(o)--|    │ generator-ui5-ts-app-fcl │
   `---------´   │      generator!          │
    ( _´U`_ )    ╰──────────────────────────╯
    /___A___\   /
     |  ~  |
   __'.___.'__
 ´   `  |° ´ Y `
```
## Options
Besides the options you have in the basic TypeScript template like appname and namespace, we have added more options that will be used to configure the OData service:
### EndPoint
This should be an endpoint that points to the Service Document of your OData service, like for example the northwind service: https://services.odata.org/V2/OData/OData.svc/
### EntitySet
Based on the provided OData Service Document, the generator will provide you a list of all available OData EntitySets. You will be able to select one as your main EntitySet. The Master page will show a list of all entries in this EntitySet, while the detail page will show the details of the selected entry.
### Key
The next option is the key. You'll have to select the field you would like to use as the main key. This will be used in the routing configuration as parameter to navigate to the detail page.
### Title
The title option will be bound to the title in the list as well as on the detail page.
### Other Field
This last one is an open and free field to bind a second field to the table and on the detail page. It can be a numbe or a description of the title. Just one additional field to kickstart your project!

## Support

Please use the GitHub bug tracking system to post questions, bug reports or to create pull requests.

## Contributing

We welcome any type of contribution (code contributions, pull requests, issues) to this generator equally.

## License

This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the LICENSE file.

[license-image]: https://img.shields.io/github/license/ui5-community/generator-ui5-ts-app-fcl.svg
[license-url]: https://github.com/ui5-community/generator-ui5-ts-app-fcl/blob/main/LICENSE

---------------------------
###### This generator is provided to you by Peter Muessig and Wouter Lemaire