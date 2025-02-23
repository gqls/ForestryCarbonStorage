This is a [Next.js](https://nextjs.org) 

This project is the visualisation of Satellite data from over 90,000 forestry plots in Sweden and Finland.

Data from two satellite projects is used. Sentinel 1 gives us radar data which is good for e.g. water content, weather conditions etc.
Sentinel 2 data is optical data of different wavelengths. 
NDVI - Normalised Difference Vegetation Index is a ratio of combinations of visible light and near infrared light.
It is used to determine vegetation health and density.
The formula is NDVI = (NIR — VIS)/(NIR + VIS) 
Negative values indicate water or clouds, while positive values indicate vegetation
Red light absorption indicates good plant health.
Near infrared reflection (i.e. higher values) indicate more biomass and healthy plants.



## Getting Started

project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
