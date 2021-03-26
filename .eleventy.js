const yaml = require("js-yaml");
const htmlmin = require("html-minifier");
const pluginSass = require("eleventy-plugin-sass");
const pluginPWA = require("eleventy-plugin-pwa");
const sharp = require("sharp");
const pluginNavigation = require("@11ty/eleventy-navigation");

module.exports = function (eleventyConfig) {
  // Plugins
  eleventyConfig.addPlugin(pluginSass, {
    watch: ["src/static/styles/*.{scss,sass}", "!node_modules/**"],
    outputDir: "_site/static/styles",
    cleanCSS: true,
  });
  eleventyConfig.addPlugin(pluginPWA);
  eleventyConfig.addPlugin(pluginNavigation);

  // Merge data instead of overriding
  eleventyConfig.setDataDeepMerge(true);

  // YAML support
  eleventyConfig.addDataExtension("yaml", (contents) =>
    yaml.safeLoad(contents)
  );

  // Copy static files and folders
  eleventyConfig.addPassthroughCopy({
    "./src/admin/config.yml": "./admin/config.yml",
  });
  eleventyConfig.addPassthroughCopy("./src/static/images");
  eleventyConfig.addPassthroughCopy("./src/static/fonts");
  eleventyConfig.addPassthroughCopy("./src/favicon.ico");
  eleventyConfig.addPassthroughCopy("./src/robots.txt");
  eleventyConfig.addPassthroughCopy("./src/manifest.webmanifest");

  // Add partners to collection
  eleventyConfig.addCollection(
    "partnersList",
    require("./src/_11ty/getPartnersList.js")
  );

  // Filter to get year by passing date
  eleventyConfig.addFilter("getYear", (dateObj) => {
    return dateObj.getFullYear();
  });

  // Responsive images
  if (process.env.NODE_ENV != "development") {
    eleventyConfig.addTransform("images", function (content, outputPath) {
      const path = /index\.html/i;
      const imagesInParagraph = /\<p\>\<img src\=\"\/static\/images\/([^\.]*).([^\"]*)\" alt\=\"([^\"]*)?\"\>\<\/p\>/gi;
      const images = /\<img src\=\"\/static\/images\/([^\.]*).([^\"]*)\" alt(\=\"[^\"]*\")?\>/gi;

      // Image sizes property for adaptive images
      const sizes =
        "(max-width: 1000px) calc(100vw - 2 * 1rem), \
        (max-width: calc(1500px + 2 * 1rem)) calc((100vw - 2 * 1rem - 0.5rem) / 2), \
        calc((1500 - 0.5rem) / 2)";

      // Generate a responsive images
      // and create markup by url, image extension and alternate text
      function generateImage(url, extension, alt) {
        // Show this text as alt if alt attribute is not given
        const defaultAlt = "Фотография проекта";

        // Get image
        const image = sharp(`src/static/images/${url}.${extension}`);
        // Resize image to 320px and 640px
        const smallImage = image.clone().resize({ width: 320 });
        const mediumImage = image.clone().resize({ width: 640 });

        // Generate a webp version of a large image
        image.clone().webp().toFile(`_site/static/images/${url}.webp`);
        // Generate a small original and webp image
        smallImage
          .clone()
          .toFile(`_site/static/images/${url}-small.${extension}`);
        smallImage
          .clone()
          .webp()
          .toFile(`_site/static/images/${url}-small.webp`);
        // Generate a medium original and webp image
        mediumImage
          .clone()
          .toFile(`_site/static/images/${url}-medium.${extension}`);
        mediumImage
          .clone()
          .webp()
          .toFile(`_site/static/images/${url}-medium.webp`);

        return `
          <figure>
            <picture>
              <source
                srcset="/static/images/${url}-small.webp 320w,
                /static/images/${url}-medium.webp 640w,
                /static/images/${url}.webp 1000w"
                sizes="${sizes}"
                type="image/webp">
              <img
                data-src="auto"
                srcset="/static/images/${url}-small.${extension} 320w,
                /static/images/${url}-medium.${extension} 640w,
                /static/images/${url}.${extension} 1000w"
                data-srcset="/static/images/${url}-small.${extension} 320w,
                /static/images/${url}-medium.${extension} 640w,
                /static/images/${url}.${extension} 1000w"
                sizes="${sizes}"
                alt="${alt || defaultAlt}" loading="lazy">
            </picture>
          </figure>`;
      }

      if (outputPath && outputPath.match(path)) {
        content = content.replace(imagesInParagraph, (match, p1, p2, p3) => {
          return generateImage(p1, p2, p3);
        });
        content = content.replace(images, (match, p1, p2, p3) => {
          return generateImage(p1, p2, p3);
        });
      }

      return content;
    });
  }

  // Minify HTML
  eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
    if (outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });
      return minified;
    }

    return content;
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
    },
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
};
