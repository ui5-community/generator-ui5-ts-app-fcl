"use strict";
const Generator = require("yeoman-generator");
// patches the Generator for the install tasks as new custom install
// tasks produce ugly errors! (Related issue: https://github.com/yeoman/environment/issues/309)
require("lodash").extend(Generator.prototype, require("yeoman-generator/lib/actions/install"));

const path = require("path");
const { URL } = require('url');

const chalk = require("chalk");
const yosay = require("yosay");
const glob = require("glob");
const semver = require("semver");
const packageJson = require('package-json');

const { isValidUrl, ODataMetadata } = require("./utils");

module.exports = class extends Generator {

  static displayName = "Create a new UI5 TypeScript application using the FlexibleColumnLayout";

  constructor(args, opts) {
    super(args, opts, {
      // disable the Yeoman 5 package-manager logic (auto install)!
      customInstallTask: "disabled"
    });
  }

  prompting() {

    // Have Yeoman greet the user.
    if (!this.options.embedded) {
      this.log(
        yosay(`Welcome to the ${chalk.red("generator-ui5-ts-app-fcl")} generator!`)
      );
    }

    const entities = {
      Products: ["Id", "Name", "Price"],
      Suppliers: ["Id", "Test", "more"]
    };
    const minFwkVersion = {
      OpenUI5: "1.90.1", //"1.60.0",
      SAPUI5: "1.90.0" //"1.77.0"
    };

    const fwkCDNDomain = {
      OpenUI5: "sdk.openui5.org",
      SAPUI5: "ui5.sap.com"
    };

    const getTypePackageFor = function (framework, version = "99.99.99") {
      const typesName = semver.gte(version, "1.113.0") ? "types" : "ts-types-esm";
      return `@${framework.toLowerCase()}/${typesName}`;
    };

    let metadata;
    const prompts = [
      {
        type: "input",
        name: "application",
        message: "How do you want to name this application?",
        validate: s => {
          if (/^\d*[a-zA-Z][a-zA-Z0-9]*$/g.test(s)) {
            return true;
          }
          return "Please use alpha numeric characters only for the application name.";
        },
        default: "myapp"
      },
      {
        type: "input",
        name: "namespace",
        message: "Which namespace do you want to use?",
        validate: s => {
          if (/^[a-zA-Z0-9_.]*$/g.test(s)) {
            return true;
          }
          return "Please use alpha numeric characters and dots only for the namespace.";
        },
        default: "com.myorg"
      },
      {
        type: "input",
        name: "endpoint",
        message: "Which endpoint do you want to use for your OData service?",
        validate: async (url) => {
          if (isValidUrl(url, ['http', 'https'])) {
            try {
              metadata = await ODataMetadata.load(url);
              return !!metadata;
            } catch (err) {
              return `Please provide a valid OData service endpoint.\n${err.message}`;
            }
          }
          return "Please provide a valid OData service endpoint.";
        },
        default: "https://services.odata.org/V2/OData/OData.svc/"
      },
      {
        type: "list",
        name: "entity",
        message: "Which entity do you want to start from?",
        choices: answers => {
          return metadata.getEntitySets();
        }
      },
      {
        type: "list",
        name: "key",
        message: "Which property do you want to use as key?",
        choices: answers => {
          return metadata.getKeys(answers.entity);
        }
      },
      {
        type: "list",
        name: "title",
        message: "Which property do you want to use as title?",
        choices: answers => {
          return metadata.getProperties(answers.entity);
        }
      },
      {
        type: "list",
        name: "otherField",
        message: "Which other property do you want to use as well?",
        choices: answers => {
          return metadata.getProperties(answers.entity);
        }
      },
      {
        type: "list",
        name: "framework",
        message: "Which framework do you want to use?",
        choices: ["OpenUI5", "SAPUI5"],
        default: "OpenUI5"
      },
      {
        type: "input",
        name: "frameworkVersion",
        message: "Which framework version do you want to use?",
        when: response => {
          this._minFwkVersion = minFwkVersion[response.framework];
          return true;
        },
        default: async (answers) => {
          const npmPackage = getTypePackageFor(answers.framework);
          try {
            return (await packageJson(npmPackage)).version;
          } catch (ex) {
            chalk.red('Failed to lookup latest version for ${npmPackage}! Fallback to min version...')
            return minFwkVersion[answers.framework];
          }
        },
        validate: v => {
          return (
            (v && semver.valid(v) && semver.gte(v, this._minFwkVersion)) ||
            chalk.red(
              `Framework requires the min version ${this._minFwkVersion} due to the availability of the ts-types!`
            )
          );
        }
      },
      {
        type: "input",
        name: "author",
        message: "Who is the author of the application?",
        default: this.user.git.name()
      },
      {
        type: "confirm",
        name: "newdir",
        message: "Would you like to create a new directory for the application?",
        default: true
      }
    ];

    return this.prompt(prompts).then(props => {
      // use the namespace and the application name as new subdirectory
      if (props.newdir) {
        this.destinationRoot(this.destinationPath(`${props.namespace}.${props.application}`));
      }
      delete props.newdir;

      // apply the properties
      this.config.set(props);
      this.config.set("framework", props.framework);

      // determine the ts-types and version
      this.config.set("tstypes", getTypePackageFor(props.framework, props.frameworkVersion));
      this.config.set("tstypesVersion", props.frameworkVersion);

      // appId + appURI
      this.config.set("appId", `${props.namespace}.${props.application}`);
      this.config.set("appURI", `${props.namespace.split(".").join("/")}/${props.application}`);

      // CDN domain
      this.config.set("cdnDomain", fwkCDNDomain[props.framework]);

      // default theme
      if (semver.gte(props.frameworkVersion, "1.108.0")) {
        this.config.set("defaultTheme", "sap_horizon");
      } else {
        this.config.set("defaultTheme", "sap_fiori_3");
      }

      // more relevant parameters
      this.config.set("gte11130", semver.gte(props.frameworkVersion, "1.113.0"));
      this.config.set("gte11150", semver.gte(props.frameworkVersion, "1.115.0"));
      this.config.set("gte11160", semver.gte(props.frameworkVersion, "1.116.0"));
      this.config.set("gte11170", semver.gte(props.frameworkVersion, "1.117.0"));

      // apply OData settings
      const odataSettings = new URL(props.endpoint);
      this.config.set("origin", odataSettings.origin);
      this.config.set("path", odataSettings.pathname);
      this.config.set("pathPrefix", `/${odataSettings.pathname.substring(1).split('/')[0]}`);
    });
  }

  writing() {
    const oConfig = this.config.getAll();

    this.sourceRoot(path.join(__dirname, "templates"));
    glob
      .sync("**", {
        cwd: this.sourceRoot(),
        nodir: true
      })
      .forEach(file => {
        const sOrigin = this.templatePath(file);
        let sTarget = this.destinationPath(
          file
            .replace(/^_/, "")
            .replace(/\/_/, "/")
        );

        this.fs.copyTpl(sOrigin, sTarget, oConfig);
      });
  }

  install() {
    this.config.set("setupCompleted", true);
    // needed as long as the Yeoman 5.x installer produces
    // ugly error messages while looking for package.json
    this.installDependencies({
      bower: false,
      npm: true
    });
  }

  end() {
    this.spawnCommandSync("git", ["init", "--quiet"], {
      cwd: this.destinationPath()
    });
    this.spawnCommandSync("git", ["add", "."], {
      cwd: this.destinationPath()
    });
    this.spawnCommandSync(
      "git",
      [
        "commit",
        "--quiet",
        "--allow-empty",
        "-m",
        "Initial commit"
      ],
      {
        cwd: this.destinationPath()
      }
    );
  }
};
