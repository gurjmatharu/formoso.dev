export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    twitter: string;
    github: string;
  };
};

export const siteConfig: SiteConfig = {
  name: "Formoso",
  description: "An open source formoso.",
  url: ".com",
  ogImage: "",
  links: {
    twitter: "https://twitter.com/gurjmatharu",
    github: "https://github.com/gurjmatharu/formoso",
  },
};
