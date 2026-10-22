import type { TrackrItem } from '../domain/types';
import { TMDB_IMG } from '../catalog/tmdb';

const tmdbPoster = (p: string) => `${TMDB_IMG}/w500${p}`;
const rawgImg = (p: string) => `https://media.rawg.io/media/games/${p}.jpg`;

export const MOCK_LIBRARY: TrackrItem[] = [
  {
    id: 'm1', apiSource: 'local_mock', title: 'Dune: Part Two', type: 'movie', year: 2024,
    coverUrl: tmdbPoster('/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg'), genres: ['Ficção Científica', 'Aventura'],
    rating: 4.1, myRating: 5, myStatus: 'completed', metaDuration: '2h 46min', platforms: ['Max', 'Prime Video'],
    summary: 'Paul Atreides une-se a Chani e aos Fremen numa guerra de vingança contra os conspiradores que destruíram a sua família. Perante uma escolha entre o amor da sua vida e o destino do universo, tenta evitar um futuro terrível que só ele consegue prever.',
    likedByFriends: ['Diogo', 'Sara'], progress: 166, progressTotal: 166,
  },
  {
    id: 'm2', apiSource: 'local_mock', title: 'Interstellar', type: 'movie', year: 2014,
    coverUrl: tmdbPoster('/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg'), genres: ['Ficção Científica', 'Drama'],
    rating: 4.2, myRating: 5, myStatus: 'completed', metaDuration: '2h 49min', platforms: ['Netflix', 'Prime Video'],
    summary: 'Numa Terra a morrer, um grupo de exploradores atravessa um buraco de minhoca perto de Saturno em busca de um novo lar para a humanidade, enfrentando o tempo, a gravidade e a distância que os separa de quem amam.',
    likedByFriends: ['Diogo', 'Sara', 'Marta'], progress: 169, progressTotal: 169,
  },
  {
    id: 'm3', apiSource: 'local_mock', title: 'Oppenheimer', type: 'movie', year: 2023,
    coverUrl: tmdbPoster('/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg'), genres: ['Drama', 'História'],
    rating: 4.0, myStatus: 'backlog', metaDuration: '3h 00min', platforms: ['Prime Video'],
    summary: 'A história de J. Robert Oppenheimer e do seu papel no desenvolvimento da bomba atómica durante a Segunda Guerra Mundial — e do preço moral que se seguiu.',
    likedByFriends: ['Marta', 'Diogo'], progressTotal: 180,
  },
  {
    id: 'm4', apiSource: 'local_mock', title: 'Spider-Man: Across the Spider-Verse', type: 'movie', year: 2023,
    coverUrl: tmdbPoster('/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg'), genres: ['Animação', 'Ação'],
    rating: 4.2, myStatus: 'backlog', metaDuration: '2h 20min', platforms: ['Netflix'],
    summary: 'Miles Morales atravessa o Multiverso e encontra uma equipa de Homens-Aranha encarregada de proteger a sua própria existência. Quando discordam sobre como lidar com uma nova ameaça, Miles terá de redefinir o que é ser herói.',
    likedByFriends: ['Sara', 'Marta', 'Diogo'], progressTotal: 140,
  },
  {
    id: 'm5', apiSource: 'local_mock', title: 'Everything Everywhere All at Once', type: 'movie', year: 2022,
    coverUrl: tmdbPoster('/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg'), genres: ['Ação', 'Comédia'],
    rating: 3.9, myStatus: 'in_progress', metaDuration: '2h 19min', platforms: ['Prime Video'],
    summary: 'Uma imigrante sobrecarregada vê-se arrastada para uma aventura insana em que só ela pode salvar o mundo, explorando outros universos e as vidas que poderia ter vivido.',
    likedByFriends: ['Sara'], progress: 62, progressTotal: 139,
  },
  {
    id: 'm6', apiSource: 'local_mock', title: 'Your Name.', type: 'movie', year: 2016,
    coverUrl: tmdbPoster('/q719jXXEzOoYaps6babgKnONONX.jpg'), genres: ['Animação', 'Romance'],
    rating: 4.3, myStatus: 'backlog', metaDuration: '1h 46min', platforms: ['Netflix'],
    summary: 'Dois adolescentes que nunca se conheceram descobrem que trocam de corpo enquanto dormem. Uma ligação improvável que atravessa tempo e distância.',
    likedByFriends: ['Marta', 'Sara'], progressTotal: 106,
  },
  {
    id: 's1', apiSource: 'local_mock', title: 'Succession', type: 'series', year: 2018,
    coverUrl: tmdbPoster('/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg'), genres: ['Drama', 'Comédia'],
    rating: 4.3, myRating: 4, myStatus: 'completed', metaDuration: '4 temporadas · 39 ep', platforms: ['Max'],
    summary: 'A família Roy controla um dos maiores impérios de media do mundo. Quando o patriarca começa a afastar-se, os filhos disputam o trono com tudo o que têm — e não têm.',
    likedByFriends: ['Sara', 'Diogo'], progress: 39, progressTotal: 39,
  },
  {
    id: 's2', apiSource: 'local_mock', title: 'Severance', type: 'series', year: 2022,
    coverUrl: tmdbPoster('/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg'), genres: ['Mistério', 'Ficção Científica'],
    rating: 4.2, myRating: 5, myStatus: 'in_progress', metaDuration: '2 temporadas · 19 ep', platforms: ['Apple TV+'],
    summary: 'Mark lidera uma equipa de funcionários cujas memórias foram cirurgicamente divididas entre o trabalho e a vida pessoal. Quando um colega misterioso aparece fora do escritório, começa uma viagem para descobrir a verdade.',
    likedByFriends: ['Sara', 'Marta'], progress: 12, progressTotal: 19,
  },
  {
    id: 's3', apiSource: 'local_mock', title: 'The Last of Us', type: 'series', year: 2023,
    coverUrl: tmdbPoster('/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg'), genres: ['Drama', 'Ação'],
    rating: 4.3, myStatus: 'backlog', metaDuration: '2 temporadas · 16 ep', platforms: ['Max'],
    summary: 'Vinte anos após o colapso da civilização, Joel é contratado para tirar Ellie, uma rapariga de 14 anos, de uma zona de quarentena opressiva. O que começa como um pequeno trabalho torna-se numa viagem brutal.',
    likedByFriends: ['Diogo', 'Sara', 'Marta'], progressTotal: 16,
  },
  {
    id: 's4', apiSource: 'local_mock', title: 'Arcane', type: 'series', year: 2021,
    coverUrl: tmdbPoster('/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg'), genres: ['Animação', 'Ação'],
    rating: 4.4, myStatus: 'in_progress', metaDuration: '2 temporadas · 18 ep', platforms: ['Netflix'],
    summary: 'Entre a utópica Piltover e a oprimida Zaun, duas irmãs lutam em lados opostos de uma guerra entre tecnologias mágicas e convicções em choque.',
    likedByFriends: ['Diogo', 'Marta'], progress: 6, progressTotal: 18,
  },
  {
    id: 's5', apiSource: 'local_mock', title: 'Shōgun', type: 'series', year: 2024,
    coverUrl: tmdbPoster('/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg'), genres: ['Drama', 'História'],
    rating: 4.3, myStatus: 'backlog', metaDuration: '1 temporada · 10 ep', platforms: ['Disney+'],
    summary: 'Japão, 1600. Lord Yoshii Toranaga luta pela sua vida enquanto os seus inimigos no Conselho de Regentes se unem contra ele — até um navio europeu misterioso naufragar numa aldeia piscatória próxima.',
    likedByFriends: ['Diogo'], progressTotal: 10,
  },
  {
    id: 's6', apiSource: 'local_mock', title: 'The Bear', type: 'series', year: 2022,
    coverUrl: tmdbPoster('/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg'), genres: ['Drama', 'Comédia'],
    rating: 4.1, myStatus: 'backlog', metaDuration: '3 temporadas · 28 ep', platforms: ['Disney+'],
    summary: 'Um jovem chef do mundo da alta cozinha regressa a Chicago para gerir a sanduicheria da família depois de uma tragédia.',
    likedByFriends: ['Sara', 'Marta'], progressTotal: 28,
  },
  {
    id: 's7', apiSource: 'local_mock', title: 'Breaking Bad', type: 'series', year: 2008,
    coverUrl: tmdbPoster('/ggFHVNu6YYI5L9pCfOacjizRGt.jpg'), genres: ['Drama', 'Crime'],
    rating: 4.5, myRating: 5, myStatus: 'completed', metaDuration: '5 temporadas · 62 ep', platforms: ['Netflix'],
    summary: 'Um professor de química com cancro terminal alia-se a um antigo aluno para produzir e vender metanfetamina e garantir o futuro da família.',
    likedByFriends: ['Diogo'], progress: 62, progressTotal: 62,
  },
  {
    id: 'g1', apiSource: 'local_mock', title: 'Elden Ring', type: 'game', year: 2022,
    coverUrl: rawgImg('b29/b294fdd866dcdb643e7bab370a552855'), genres: ['RPG', 'Ação', 'Co-op'],
    rating: 4.4, myRating: 5, myStatus: 'in_progress', metaDuration: '~95h', platforms: ['PC', 'PlayStation', 'Xbox'],
    summary: 'Ergue-te, Maculado, e deixa-te guiar pela graça para empunhares o poder do Anel Prístino e te tornares Senhor Prístino nas Terras Intermédias. Um mundo aberto vasto, masmorras complexas e co-op online.',
    likedByFriends: ['Diogo', 'Marta'], progress: 64, progressTotal: 95,
  },
  {
    id: 'g2', apiSource: 'local_mock', title: "Baldur's Gate 3", type: 'game', year: 2023,
    coverUrl: rawgImg('699/69907ecf13f172e9e144069769c3be73'), genres: ['RPG', 'Estratégia', 'Co-op'],
    rating: 4.5, myStatus: 'backlog', metaDuration: '~100h', platforms: ['PC', 'PlayStation', 'Xbox'],
    summary: 'Reúne o teu grupo e regressa aos Reinos Esquecidos numa história de amizade, traição, sacrifício e sobrevivência — com co-op até 4 jogadores e escolhas com peso real.',
    likedByFriends: ['Diogo', 'Sara', 'Marta'], progressTotal: 100,
  },
  {
    id: 'g3', apiSource: 'local_mock', title: 'It Takes Two', type: 'game', year: 2021,
    coverUrl: rawgImg('d47/d479582ed0a46496ad34f65c7099d7e5'), genres: ['Aventura', 'Plataformas', 'Co-op'],
    rating: 4.5, myStatus: 'backlog', metaDuration: '~14h', platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
    summary: 'Uma aventura de plataformas feita exclusivamente para dois jogadores. Cody e May, transformados em bonecos, têm de cooperar para salvar o casamento — e voltar ao normal.',
    likedByFriends: ['Sara', 'Marta'], progressTotal: 14,
  },
  {
    id: 'g4', apiSource: 'local_mock', title: 'Portal 2', type: 'game', year: 2011,
    coverUrl: rawgImg('2ba/2bac0e87cf45e5b508f227d281c9252a'), genres: ['Puzzle', 'Co-op'],
    rating: 4.6, myRating: 5, myStatus: 'completed', metaDuration: '~11h', platforms: ['PC', 'PlayStation', 'Xbox'],
    summary: 'Regressa ao Aperture Science com a portal gun, uma IA vingativa e um modo cooperativo dedicado com dois robôs que vai testar qualquer amizade.',
    likedByFriends: ['Diogo'], progress: 11, progressTotal: 11,
  },
  {
    id: 'g5', apiSource: 'local_mock', title: 'Hades', type: 'game', year: 2020,
    coverUrl: rawgImg('1f4/1f47a270b8f241e4676b14d39ec620f7'), genres: ['Roguelike', 'Ação'],
    rating: 4.4, myStatus: 'in_progress', metaDuration: '~22h', platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
    summary: 'Desafia o deus dos mortos enquanto abres caminho para fora do Submundo neste roguelike de ação dos criadores de Bastion e Transistor.',
    likedByFriends: ['Marta'], progress: 9, progressTotal: 22,
  },
  {
    id: 'g6', apiSource: 'local_mock', title: 'The Witcher 3: Wild Hunt', type: 'game', year: 2015,
    coverUrl: rawgImg('618/618c2031a07bbff6b4f611f10b6bcdbc'), genres: ['RPG', 'Aventura'],
    rating: 4.7, myRating: 3, myStatus: 'dropped', metaDuration: '~50h', platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
    summary: 'Geralt de Rívia, caçador de monstros, procura a filha adotiva num mundo aberto devastado pela guerra e perseguido pela Caçada Selvagem.',
    likedByFriends: ['Diogo', 'Sara'], progress: 18, progressTotal: 50,
  },
];

/** Extra titles searchable offline (simulates "web" results without API keys). */
export const MOCK_CATALOG: TrackrItem[] = [
  {
    id: 'c1', apiSource: 'local_mock', title: 'BioShock Infinite', type: 'game', year: 2013,
    coverUrl: rawgImg('fc1/fc1307a2774506b5bd65d7e8424664a7'), genres: ['Ação', 'Shooter'],
    rating: 4.4, myStatus: 'backlog', metaDuration: '~12h', platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
    summary: 'Columbia, uma cidade flutuante nos céus de 1912. Booker DeWitt tem uma dívida para saldar: encontrar Elizabeth.',
    likedByFriends: ['Diogo'], progressTotal: 12,
  },
  {
    id: 'c2', apiSource: 'local_mock', title: 'The Elder Scrolls V: Skyrim', type: 'game', year: 2011,
    coverUrl: rawgImg('7cf/7cfc9220b401b7a300e409e539c9afd5'), genres: ['RPG', 'Aventura'],
    rating: 4.4, myStatus: 'backlog', metaDuration: '~34h', platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
    summary: 'O regresso dos dragões a Skyrim. És o Dovahkiin, o Sangue de Dragão, a única esperança de uma terra dividida pela guerra civil.',
    likedByFriends: ['Marta'], progressTotal: 34,
  },
  {
    id: 'c3', apiSource: 'local_mock', title: 'Grand Theft Auto V', type: 'game', year: 2013,
    coverUrl: rawgImg('20a/20aa03a10cda45239fe22d035c0ebe64'), genres: ['Ação', 'Mundo Aberto', 'Co-op'],
    rating: 4.5, myStatus: 'backlog', metaDuration: '~74h', platforms: ['PC', 'PlayStation', 'Xbox'],
    summary: 'Três criminosos muito diferentes arriscam tudo numa série de golpes ousados em Los Santos.',
    likedByFriends: ['Diogo', 'Sara'], progressTotal: 74,
  },
  {
    id: 'c4', apiSource: 'local_mock', title: 'Elden Ring Nightreign', type: 'game', year: 2025,
    coverUrl: rawgImg('5ec/5ecac5cb026ec26a56efcc546364e348'), genres: ['Ação', 'Co-op'],
    rating: 4.0, myStatus: 'backlog', metaDuration: '~30h', platforms: ['PC', 'PlayStation', 'Xbox'],
    summary: 'Uma experiência cooperativa independente no universo de Elden Ring para até três jogadores.',
    likedByFriends: [], progressTotal: 30,
  },
];
