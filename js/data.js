// All the content that repeats. Edit here; the page rebuilds itself.

const img = (name) => `imgs/work/${name}.webp`;

export const featured = [
  {
    title: 'Enneuma',
    url: 'https://enneuma.com',
    image: img('enneuma'),
    text: 'An Enneagram assessment that goes after motivation instead of habits. Twenty-three careful questions map the type at your core, the mask it hides behind and the strength you have been holding back.',
    tags: ['Next.js', 'Claude', 'Psychology'],
  },
  {
    title: 'Individuation',
    url: 'https://individuation.life',
    image: img('individuation'),
    text: 'A reading room for dreams. Describe one and it is read the way Jung would: as an honest message from the unconscious about your present, never a fortune about your future. English and Georgian.',
    tags: ['Next.js', 'Claude', 'Psychology'],
  },
  {
    title: 'Front End Hub',
    url: 'https://thothcher.github.io/frontend-hub/',
    image: img('frontendhub'),
    text: 'The AI-first fullstack program at IT Step Academy as one platform. Five phases, thirty weeks, sixty-eight lectures: from an empty folder to a production deployment.',
    tags: ['Angular', 'Claude', 'Teaching'],
  },
  {
    title: 'PsyLearn',
    url: 'https://thothcher.github.io/psy-life',
    image: img('psy-life'),
    text: 'Zimbardo’s Psychology & Life turned into an interactive course. Sixteen chapters, 150+ quiz questions, memory games and the stories of sixteen psychologists.',
    tags: ['Angular', 'Claude', 'Psychology'],
  },
  {
    title: 'SHTA',
    url: 'https://thothcher.github.io/SHTA/',
    image: img('shta'),
    text: 'A Georgian-language study platform for Introduction to Modern Thought at Ilia State University. Twelve chapters, 60+ quiz questions, twelve thinkers.',
    tags: ['Angular', 'Claude', 'Teaching'],
  },
  {
    title: 'Brain Atlas 2120',
    url: 'https://thothcher.github.io/brain-atlas-2120/#atlas',
    image: img('brain-atlas-2120'),
    text: 'An interactive 3D neuroanatomy atlas for psychology and medicine students. Thirty structures to rotate, slice and study, in English and Georgian.',
    tags: ['3D', 'Codex', 'Psychology'],
  },
  {
    title: 'Angular Flow Lab',
    url: 'https://thothcher.github.io/schemas/',
    image: img('angular-flow-lab'),
    text: 'A visual playground for IT Step students. Drag blocks, wire a database to an endpoint to a component, press Run Flow and watch the data travel through an Angular app.',
    tags: ['Angular', 'Claude', 'Teaching'],
  },
  {
    title: 'Le Bistro Lecture Decks',
    url: 'https://thothcher.github.io/bistro-track/',
    image: img('bistro-track'),
    text: 'Twenty-nine lecture decks for IT Step in syllabus order: HTML & CSS, React, security and Angular. Every deck has speaker notes, classwork and a design brief you can paste into an AI tool to build the next one in the same style.',
    tags: ['HTML & CSS', 'React', 'Teaching'],
  },
  {
    title: 'Frontend Presentations',
    url: 'https://thothcher.github.io/presentations/',
    image: img('presentations'),
    text: 'A Georgian-language archive of front-end lectures: HTML & CSS, JavaScript, Angular and Git, next to the full map of a 72-lecture AI-native front-end course. Several decks were written by students.',
    tags: ['JavaScript', 'Angular', 'Teaching'],
  },
];

export const archive = [
  ['Xchain AI', 'Landing page', ['Figma', 'HTML', 'CSS', 'JS'], 'https://xchain.netlify.app/', 'xchain'],
  ['Family Medical Regional Center', 'Clinic website', ['PHP', 'Figma'], 'https://fmrc.info/', 'project-10'],
  ['Ceno Studios', 'Studio website', ['Webflow'], 'https://www.cenostudios.com/', 'ceno'],
  ['Section A — Banking', 'Landing page', ['Figma', 'HTML', 'CSS', 'JS'], 'https://sectionaaa.netlify.app/', 'section-banking'],
  ['Telecom', 'Landing page', ['Figma', 'HTML', 'CSS', 'JS'], 'https://adriancontact.netlify.app', 'telecom'],
  ['Pdfify', 'Docs converter', ['HTML', 'CSS', 'JS'], 'https://pdffy.netlify.app/', 'pdfify'],
  ['Code Modulo', 'Landing page', ['HTML', 'CSS', 'JS'], 'https://sectionawebsites.netlify.app/', 'codemodulo'],
  ['Section A — Dating', 'Landing page', ['Figma', 'HTML', 'CSS', 'JS'], 'https://sectionaa.netlify.app/', 'section-dating'],
  ['VA Production', 'Production house', ['Figma', 'HTML', 'CSS', 'JS'], 'https://vaproduction.ge/', 'vaproduction'],
  ['Moda Mademoiselle', 'Online store', ['Figma', 'Shopify'], 'https://moda-mademoiselle.com/', 'moda'],
  ['Fluffy Brother', 'NFT project', ['React'], 'https://fluffybrother.com/', 'work-4'],
  ['Complex-Rex', 'NFT project', ['React'], 'http://complexrex.io/', 'work-5'],
  ['GVAbrands', 'Online store', ['Shopify'], 'https://gvabrands.com/', 'shopify'],
  ['Gazzelion', 'NFT project', ['React'], 'https://gazellion.co.uk/', 'work-6'],
  ['PissedOff', 'NFT project', ['React'], 'https://pissedoff2.netlify.app/', 'work-7'],
  ['Oceanpets', 'NFT project', ['HTML', 'CSS', 'JS'], 'https://oceanpets.netlify.app/', 'oceanpets'],
  ['iMedical', 'Medical help', ['HTML', 'CSS', 'JS'], 'https://imedicaldemo.netlify.app/', 'imedical'],
  ['Sevenstock', 'Holding website', ['HTML', 'CSS', 'JS'], 'https://joyful-boba-418053.netlify.app/', 'sevenstocks'],
  ['Hails', 'NFT project', ['HTML', 'CSS', 'JS'], 'https://relaxed-kelpie-185bdb.netlify.app/', 'hails'],
].map(([title, kind, tags, url, image]) => ({ title, kind, tags, url, image: img(image), year: 2022 }));

export const students = [
  ['Unique Restaurant', 'Lina Phareulidze', 2026, 'https://step-last.vercel.app/', 'lina'],
  ['TechCards', 'Mikheil Simonia', 2026, 'https://techacad1.netlify.app/', 'mikheil'],
  ['Tech World', 'Kristine Jghenti', 2026, 'https://technotechnolife.netlify.app/', 'kristi'],
  ['Lunara Beauty', 'Mariam Datiashvili', 2026, 'https://mariamdatiashvili-sys.github.io/lunara-beauty1/', 'mariamdatiashvili'],
  ['MovieLand', 'Mariam Tediashvili', 2026, 'https://movieland-hub.netlify.app/#/', 'mariamted'],
  ['Railway Tickets', 'Tamar Dvali', 2026, 'https://train-booking-app-angular.netlify.app/', 'takodvali'],
  ['Boutique', 'Mariam Klibadze', 2026, 'https://mariamklibadze.github.io/ProjectSH/', 'mariamklibade'],
  ['იკითხე', 'Nino Womikuridze', 2026, 'https://ikitxee.netlify.app/', 'nino-wignebi'],
  ['Assassin’s Creed', 'Georgi Dagargulia', 2024, 'https://assasincreed.netlify.app/', 'georgia'],
  ['Railway Tickets', 'Nikoloz Baratashvili', 2024, 'https://railwaytickets.netlify.app/', 'bara'],
  ['Movies', 'Giorgi Sakhvadze', 2024, 'https://spectacular-treacle-1f6ec1.netlify.app/', 'sakhva2'],
  ['Clothes Store', 'Giorgi Sakhvadze', 2024, 'https://fancy-custard-11c870.netlify.app/', 'sakhva'],
  ['Restaurant', 'Lasha Vefkhvadze', 2024, 'https://resonant-maamoul-4ec63a.netlify.app/', 'lasha_didi'],
  ['Hotels Tbilisi', 'Giorgi Merabishvili', 2024, 'https://hotelstbilisi.netlify.app', 'chola'],
  ['Railway Tickets', 'Ani Gigiashvili', 2024, 'https://railway-ani.netlify.app/', 'ani'],
  ['Pink Monkey', 'Salome Karseladze', 2024, 'https://pinkmonkeychocolate.netlify.app/', 'salo'],
  ['Restaurant', 'Lasha Robakidze', 2024, 'https://lash05.netlify.app/', 'lasha'],
].map(([title, by, year, url, image]) => ({ title, by, year, url, image: img(image) }));

export const stack = [
  'Angular', 'TypeScript', 'JavaScript', 'React', 'Next.js', 'Sass', 'Tailwind CSS', 'REST API',
  'PHP', 'MySQL', 'Shopify', 'WordPress', 'Webflow', 'Figma', 'Claude', 'Codex',
];

export const profile = {
  name: 'Givi Vakhtangishvili',
  role: 'Front-end developer, programming lecturer, psychologist',
  bio: [
    'I build products with Angular, Next.js and AI tools, and I teach the next wave of developers at IT Academy STEP in Tbilisi.',
    'I am also a psychologist, so motivation, attention and memory shape the interfaces I make, and half of my side projects.',
    'A lifelong learner: I try to make something new, then share what I know with whoever wants it.',
  ],
  links: [
    ['Email', 'mailto:g.vakhtangishvili@itstep.ge'],
    ['LinkedIn', 'https://www.linkedin.com/in/givi-vakhtangishvili-85a999213/'],
    ['GitHub', 'https://github.com/thothcher'],
    ['Dribbble', 'https://dribbble.com/Parallel_Today'],
  ],
};

// Live stations whose streams may be played from other sites. Cool jazz,
// lounge and house, and nothing else.
export const stations = [
  ['Radio Swiss Jazz', 'Cool jazz', 'https://stream.srg-ssr.ch/m/rsj/mp3_128'],
  ['FluxFM Lounge', 'Lounge', 'https://streams.fluxfm.de/lounge/mp3-128/streams.fluxfm.de/'],
  ['Ibiza Global Radio', 'House', 'https://listenssl.ibizaglobalradio.com:8024/ibizaglobalradio.mp3'],
  ['FIP Jazz', 'Jazz', 'https://icecast.radiofrance.fr/fipjazz-midfi.mp3'],
  ['1.FM Chillout Lounge', 'Lounge', 'https://strm112.1.fm/chilloutlounge_mobile_mp3'],
  ['1.FM Deep House', 'Deep house', 'https://strm112.1.fm/deephouse_mobile_mp3'],
].map(([name, genre, url]) => ({ name, genre, url }));
