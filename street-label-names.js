// A label is shown only on a dated, visible road segment. Dates below are
// conservative display cutoffs when the exact renaming date is uncertain.
// They are not assertions that the entire modern street existed at that date.
export const STREET_NAMES = {
  'проспект Ленина': [[1845,'Главный проспект'],[1919.9,'улица Ленина'],[1962.68,'проспект Ленина']],
  'улица Малышева': [[1845,'Покровский проспект'],[1919.9,'улица Малышева']],
  'улица 8 Марта': [[1885,'Уктусская улица'],[1919.9,'улица Троцкого'],[1928,'улица 8 Марта']],
  'улица Карла Либкнехта': [[1845,'Вознесенский проспект'],[1919.9,'улица Карла Либкнехта']],
  'улица Вайнера': [[1845,'Успенская улица'],[1919.9,'улица Вайнера']],
  'улица Луначарского': [[1880,'Васенцовская улица'],[1929,'улица Луначарского']],
  'Московская улица': [[1845,'Московская улица']],
  'улица Белинского': [[1937,'улица Белинского']],
  'улица Челюскинцев': [[1880,'Северная улица'],[1934.46,'улица Челюскинцев']],
  'улица Свердлова': [[1880,'Верхотурская улица'],[1905,'Арсеньевский проспект'],[1919.9,'улица Свердлова']],
  'улица Репина': [[1880,'Старый Московский тракт'],[1940,'улица Репина']],
  'проспект Космонавтов': [[1962,'проспект Космонавтов']],
  'улица Мира': [[2000,'улица Мира']],
  'Шефская улица': [[2000,'Шефская улица']],
  'улица Щербакова': [[2000,'улица Щербакова']],
  'улица Татищева': [[2000,'улица Татищева']],
  'улица Серафимы Дерябиной': [[2000,'улица Серафимы Дерябиной']],
  'Объездная дорога': [[2000,'Объездная дорога']],
  'улица Вильгельма де Геннина': [[2009,'улица Вильгельма де Геннина']],
  'улица Рябинина': [[2009,'улица Рябинина']],
  'проспект Академика Сахарова': [[2010,'проспект Академика Сахарова']]
};
export const STREET_NAME_SOURCES = [
  'https://uralstalker.com/uarch/us/2026/01/18/',
  'https://old.archvuz.ru/PDF/%23%2048%20PDF/ArchPHE%2348pp146-157Kaiser.pdf',
  'https://book.uraic.ru/files/izdat/biblioteka8.pdf',
  'https://ekaterinburg-eparhia.ru/news/2023/01/28/94165/',
  'https://ekaterinburg-eparhia.ru/news/2023/02/05/94878/',
  'https://2gis.ru/ekaterinburg/geo/1267376129574329',
  'https://ru.wikipedia.org/wiki/Улица_Луначарского_(Екатеринбург)',
  'https://ru.wikipedia.org/wiki/Улица_Челюскинцев_(Екатеринбург)',
  'https://ru.wikipedia.org/wiki/Улица_Свердлова_(Екатеринбург)',
  'https://ru.wikipedia.org/wiki/Проспект_Космонавтов_(Екатеринбург)',
  'https://ru.wikipedia.org/wiki/Улица_Репина_(Екатеринбург)'
];
export function streetNameAt(name,year,x,z){
  // Historical names of the southern extensions differ from the central street.
  if(name==='Московская улица'&&year<1940&&z>1400)return null;
  const history=STREET_NAMES[name];if(!history)return null;
  let result=null;for(const [start,label]of history)if(year>=start)result=label;
  return result;
}
