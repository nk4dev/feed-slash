
interface ArticleData {
  fromCreateDate: Date;
  toCrateDate: Date;
  userId: string;
  articleId: string;
}

// from article data from database;
// from createDate is
async function getArticleData({
  fromCreateDate,
  toCrateDate,
  userId,
  articleId,
}: ArticleData) {}

// create plain text from article data
//
/*
?fromdate=2023-01-01&
?todate=2023-01-31&
?userId=1234567890&
?articleId=0987654321&
ex:
/plain?fromdate=
*/
function plainTextAPI(text: string, userId: string, articleId: string) {}

export default plainTextAPI;
