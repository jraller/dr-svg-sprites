var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var util = require("./util");
var fsutil = require("./fsutil");

module.exports = function (config, sprite) {

	var cssElementRule = "\n" +
		"{selector} {\n" +
		"width: {width};\n" +
		"height: {height};\n" +
		"background-position: {x} 0;\n" +
		"}\n";
	var cssSpriteRule = "\n" +
		"{selector} {\n" +
		"background-image: url({spriteUrl});\n" +
		"background-size: {width} {height};\n" +
		"}\n";
	var cssSVGSpriteImageRule = "\n" +
		"{selector} {\n" +
		"background-image: url({spriteUrl});\n" +
		"}\n";

	var css = "";
	var refSize = (typeof config.refSize == "string") ? config.sizes[config.refSize] : config.refSize;


	var svgSelectors = [];

	_.forOwn(config.sizes, function (size, sizeLabel) {
		var spriteSelectors = [];

		sprite.elements.forEach(function (element) {
			var className = util.makeClassName(element.className, sizeLabel, config.prefix);
			spriteSelectors.push(className);
			svgSelectors.push(className);
			css += util.substitute(cssElementRule, {
				selector: className,
				width: util.addUnits(util.scaleValue(element.width, size, refSize)),
				height: util.addUnits(util.scaleValue(element.height, size, refSize)),
				x: util.addUnits(-util.scaleValue(element.x, size, refSize))
			});
		});

		var pngSprite = sprite.sizes[sizeLabel];

		// set image and size for png
		css += util.substitute(cssSpriteRule, {
			selector: spriteSelectors.join(",\n"),
			spriteUrl: util.quotePath(path.relative(config.cssPath, pngSprite.path).replace(/\\/g, "/")),
			width: util.addUnits(pngSprite.width),
			height: util.addUnits(pngSprite.height)
		});
	});

	// set image for svg
	css += util.substitute(cssSVGSpriteImageRule, {
		selector: ".svg " + svgSelectors.join(",\n.svg "),
		spriteUrl: util.quotePath(path.relative(config.cssPath, sprite.path).replace(/\\/g, "/"))
	});

	var cssFileName = config.cssPath + "/" + util.joinName(config.cssPrefix, config.name, "sprites") + "." + config.cssSuffix;
	var filepath = path.relative(process.cwd(), cssFileName).replace(/\\/g, "/");
	var pathToFile = filepath.replace(/\/[^\/]+$/, "");

	if (!fs.existsSync(pathToFile)) {
		fsutil.mkdirRecursive(pathToFile);
	}
	fs.writeFileSync(filepath, css, "utf8");

	if (typeof config.callback == "function") {
		config.callback(null, "sprites built");
	}

};