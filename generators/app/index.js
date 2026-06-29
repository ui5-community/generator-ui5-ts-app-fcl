import chalk from "chalk";
import { glob } from "glob";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import packageJson from "package-json";
import semver from "semver";
import Generator from "yeoman-generator";
import yosay from "yosay";
import { isValidUrl, ODataMetadata } from "./utils.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default class extends Generator {
  static displayName = "Create a new UI5 TypeScript application using the FlexibleColumnLayout";

  constructor(args, opts) {
    super(args, opts, {
      // disable the Yeoman 5 package-manager logic (auto install)!
      customInstallTask: "disabled"
    });

    // declare the arguments and options of the generator, so they can be shown by --help
    this.argument("appNamespace", { // "appNamespace" is used here to avoid a conflict with the "namespace" property, which is natively in this.options, where these arguments also end up
      type: String,
      required: false,
      description: "The namespace for the application, e.g. com.myorg.myapp"
    });

    this.argument("endpoint", {
      type: String,
      required: false,
      description: "The OData service endpoint URL"
    });

    this.argument("framework", {
      type: String,
      required: false,
      description: "The framework to use, i.e. OpenUI5 or SAPUI5"
    });

    this.argument("frameworkVersion", {
      type: String,
      required: false,
      description: "The framework version to use, e.g. 1.136.0"
    });

    this.argument("author", {
      type: String,
      required: false,
      description: "The author of the application, e.g. John Doe"
    });

    this.argument("newdir", {
      type: Boolean,
      required: false,
      description: "Whether a new directory should be created for the application"
    });

    this.argument("initrepo", {
      type: Boolean,
      required: false,
      description: "Whether to initialize a local git repository for the application"
    });
  }

  async prompting() {
    // Have Yeoman greet the user.
    if (!this.options.embedded) {
      this.log(
        yosay(`Welcome to the ${chalk.red("generator-ui5-ts-app-fcl")} generator!`)
      );
    }

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

    // validate any arguments given via CLI
    if (this.options.appNamespace && !/^[a-zA-Z0-9_.]*$/g.test(this.options.appNamespace)) {
      this.log(chalk.red("The provided namespace is not valid! Please use alpha numeric characters and dots only."));
      delete this.options.appNamespace;
    }

    let metadata;
    if (this.options.endpoint) {
      if (isValidUrl(this.options.endpoint, ["http", "https"])) {
        try {
          metadata = await ODataMetadata.load(this.options.endpoint);
        } catch (err) {
          this.log(chalk.red(`Failed to load OData metadata from the provided endpoint! Please check the endpoint and your network connection.\n${err.message}`));
          delete this.options.endpoint;
        }
      } else {
        this.log(chalk.red("The provided OData endpoint is not valid! Please use a valid HTTP(S) URL."));
        delete this.options.endpoint;
      }
    }

    if (this.options.framework && !["OpenUI5", "SAPUI5"].includes(this.options.framework)) {
      this.log(chalk.red("The provided framework is not valid! Please use either OpenUI5 or SAPUI5."));
      delete this.options.framework;
    }

    if (this.options.frameworkVersion && !semver.valid(this.options.frameworkVersion)) {
      this.log(chalk.red("The provided framework version is not valid! Please use a valid semantic version, e.g. 1.136.0."));
      delete this.options.frameworkVersion;
    } else if (this.options.frameworkVersion && this.options.framework && semver.lt(this.options.frameworkVersion, minFwkVersion[this.options.framework])) {
      this.log(chalk.red(`The provided framework version ${this.options.frameworkVersion} is not valid! The minimum version for ${this.options.framework} is ${minFwkVersion[this.options.framework]}.`));
      delete this.options.frameworkVersion;
    }

    if (this.options.newdir !== undefined) { // it's coming as string because it is an argument, not an option, so we can differentiate between "undefined" and "false" value
      this.options.newdir = this.options.newdir !== "false";
    }

    if (this.options.initrepo !== undefined) { // same as above
      this.options.initrepo = this.options.initrepo !== "false";
    }

    // prepare the needed prompts
    const prompts = [];
    if (!this.options.appNamespace) { // only prompt the user when not provided already
      prompts.push({
        type: "input",
        name: "namespace",
        message: "Enter your application id (namespace)?",
        validate: (s) => {
          if (/^[a-z0-9][a-z0-9_.]*$/g.test(s)) {
            return true;
          }

          return "Please use lowercase alpha numeric characters, underscores and dots only for the namespace.";
        },
        default: "com.myorg.myapp"
      });
    }

    if (!this.options.endpoint) {
      prompts.push({
        type: "input",
        name: "endpoint",
        message: "Which endpoint do you want to use for your OData service?",
        validate: async (url) => {
          if (isValidUrl(url, ["http", "https"])) {
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
      });
    }

    // OData-specific prompts (always needed)
    prompts.push(
      {
        type: "list",
        name: "entity",
        message: "Which entity do you want to start from?",
        choices: () => {
          return metadata.getEntitySets();
        }
      },
      {
        type: "list",
        name: "key",
        message: "Which property do you want to use as key?",
        choices: (answers) => {
          return metadata.getKeys(answers.entity);
        }
      },
      {
        type: "list",
        name: "title",
        message: "Which property do you want to use as title?",
        choices: (answers) => {
          return metadata.getProperties(answers.entity);
        }
      },
      {
        type: "list",
        name: "otherField",
        message: "Which other property do you want to use as well?",
        choices: (answers) => {
          return metadata.getProperties(answers.entity);
        }
      }
    );

    if (!this.options.framework) {
      prompts.push({
        type: "list",
        name: "framework",
        message: "Which framework do you want to use?",
        choices: ["OpenUI5", "SAPUI5"],
        default: "OpenUI5"
      });
    }

    if (!this.options.frameworkVersion) {
      prompts.push({
        when: (response) => {
          this._minFwkVersion = minFwkVersion[response.framework || this.options.framework];
          return true;
        },
        type: "input",
        name: "frameworkVersion",
        message: "Which framework version do you want to use?",
        default: async (answers) => {
          const npmPackage = getTypePackageFor(answers.framework || this.options.framework);
          try {
            return (
              await packageJson(npmPackage, {
                version: "*" // use highest version, not latest!
              })
            ).version;
          } catch (ex) {
            this.log(chalk.red(`Failed to lookup latest version for ${npmPackage}! Fallback to min version...`));
            return minFwkVersion[answers.framework || this.options.framework];
          }
        },
        validate: (v) => {
          return (v && semver.valid(v) && semver.gte(v, this._minFwkVersion)) || chalk.red(`Framework requires the min version ${this._minFwkVersion} due to the availability of the type definitions!`);
        }
      });
    }

    if (!this.options.author) {
      prompts.push({
        type: "input",
        name: "author",
        message: "Who is the author of the application?",
        default: this.git.name()
      });
    }

    if (this.options.newdir === undefined) {
      prompts.push({
        type: "confirm",
        name: "newdir",
        message: "Would you like to create a new directory for the application?",
        default: true
      });
    }

    if (this.options.initrepo === undefined) {
      prompts.push({
        type: "confirm",
        name: "initrepo",
        message: "Would you like to initialize a local git repository for the application?",
        default: true
      });
    }

    return this.prompt(prompts).then((props) => {
      // merge pre-filled arguments with prompt answers
      Object.values(this._arguments).map((v) => v.name).forEach((key) => {
        props[key] = props[key] || this.options[key];
      });
      props.namespace = props.namespace || props.appNamespace; // use "namespace" from here ("appNamespace" was used in the CLI to prevent a conflict with native this.options content)

      // use the namespace and the application name as new subdirectory
      if (props.newdir) {
        this.destinationRoot(this.destinationPath(`${props.namespace}`));
      }
      delete props.newdir;

      // apply the properties
      this.config.set(props);
      this.config.set("framework", props.framework);

      // determine the ts-types and version
      this.config.set("tstypes", getTypePackageFor(props.framework, props.frameworkVersion));
      this.config.set("tstypesVersion", props.frameworkVersion);

      // appId + appURI
      this.config.set("appId", `${props.namespace}`);
      this.config.set("appURI", `${props.namespace.split(".").join("/")}`);

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
      this.config.set("lt11200", semver.lt(props.frameworkVersion, "1.120.0"));

      // apply OData settings
      const odataSettings = new URL(props.endpoint);
      this.config.set("origin", odataSettings.origin);
      this.config.set("path", odataSettings.pathname);
      this.config.set("pathPrefix", `/${odataSettings.pathname.substring(1).split("/")[0]}`);
    });
  }

  writing() {
    const oConfig = this.config.getAll();

    this.sourceRoot(join(__dirname, "templates"));
    glob
      .sync("**", {
        cwd: this.sourceRoot(),
        nodir: true
      })
      .forEach((file) => {
        const sOrigin = this.templatePath(file);
        let sTarget = this.destinationPath(file.replace(/^_/, "").replace(/\/_/, "/"));

        this.fs.copyTpl(sOrigin, sTarget, oConfig);
      });
  }

  install() {
    this.config.set("setupCompleted", true);
    this.spawnSync("npm", ["install"], {
      cwd: this.destinationPath()
    });
  }

  end() {
    if (this.config.get("initrepo")) {
      this.spawnSync("git", ["init", "--quiet"], {
        cwd: this.destinationPath()
      });
      this.spawnSync("git", ["add", "."], {
        cwd: this.destinationPath()
      });
      this.spawnSync("git", ["commit", "--quiet", "--allow-empty", "-m", "Initial commit"], {
        cwd: this.destinationPath()
      });
    }
  }
};
