/*** I declare that this assignment is my own work in accordance with
 * Seneca Academic Policy. No part of this assignment has been copied
 * manually or electronically from any other source (including web sites)
 * or distributed to other students. *
 *
 *      Name: Hayaturehman Ahmadzai
 *      Student ID: hahmadzai3
 *      Creation Date: 2021-07-06
 */

const request = require("request");

/**
 * Retrieve a profile info from rateMyProfessor
 * @param profID
 */
async function retrieveProfessor(profID) {
    return new Promise(((resolve, reject) => {
        const options = {
            'method': 'POST',
            'url': 'https://www.ratemyprofessors.com/graphql',
            'headers': {
                'Authorization': 'Basic dGVzdDp0ZXN0',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `query TeacherRatingsPageQuery(
                  $id: ID!
                ) {
                  node(id: $id) {
                    __typename
                    ... on Teacher {
                      id
                      legacyId
                      firstName
                      lastName
                      school {
                        legacyId
                        name
                        id
                      }
                      lockStatus
                      ...TeacherMetaInfo_teacher
                      ...FeaturedRatings_teacher
                      ...TeacherInfo_teacher
                      ...TeacherRatingTabs_teacher
                      ...SimilarProfessors_teacher
                    }
                    id
                  }
                }
                
                fragment TeacherMetaInfo_teacher on Teacher {
                  legacyId
                  firstName
                  lastName
                  department
                  school {
                    name
                    city
                    state
                    id
                  }
                }
                
                fragment FeaturedRatings_teacher on Teacher {
                  legacyId
                  lastName
                  avgRating
                  avgDifficulty
                  numRatings
                  ...HelpfulRating_teacher
                  ...NoRatingsArea_teacher
                  mostUsefulRating {
                    ...HelpfulRating_rating
                    id
                  }
                }
                
                fragment TeacherInfo_teacher on Teacher {
                  id
                  lastName
                  numRatings
                  ...RatingValue_teacher
                  ...NameTitle_teacher
                  ...TeacherTags_teacher
                  ...NameLink_teacher
                  ...TeacherFeedback_teacher
                  ...RateTeacherLink_teacher
                }
                
                fragment TeacherRatingTabs_teacher on Teacher {
                  numRatings
                  courseCodes {
                    courseName
                    courseCount
                  }
                  ...RatingsList_teacher
                  ...RatingsFilter_teacher
                }
                
                fragment SimilarProfessors_teacher on Teacher {
                  department
                  relatedTeachers {
                    legacyId
                    ...SimilarProfessorListItem_teacher
                    id
                  }
                }
                
                fragment SimilarProfessorListItem_teacher on RelatedTeacher {
                  legacyId
                  firstName
                  lastName
                  avgRating
                }
                
                fragment RatingsList_teacher on Teacher {
                  id
                  legacyId
                  lastName
                  numRatings
                  school {
                    id
                    legacyId
                    name
                    city
                    state
                    avgRating
                    numRatings
                  }
                  ...Rating_teacher
                  ...NoRatingsArea_teacher
                  ratings(first: 20) {
                    edges {
                      cursor
                      node {
                        ...Rating_rating
                        id
                        __typename
                      }
                    }
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                  }
                }
                
                fragment RatingsFilter_teacher on Teacher {
                  courseCodes {
                    courseCount
                    courseName
                  }
                }
                
                fragment Rating_teacher on Teacher {
                  ...RatingFooter_teacher
                  ...RatingSuperHeader_teacher
                  ...ProfessorNoteSection_teacher
                }
                
                fragment NoRatingsArea_teacher on Teacher {
                  lastName
                  ...RateTeacherLink_teacher
                }
                
                fragment Rating_rating on Rating {
                  comment
                  flagStatus
                  teacherNote {
                    id
                  }
                  ...RatingHeader_rating
                  ...RatingSuperHeader_rating
                  ...RatingValues_rating
                  ...CourseMeta_rating
                  ...RatingTags_rating
                  ...RatingFooter_rating
                  ...ProfessorNoteSection_rating
                }
                
                fragment RatingHeader_rating on Rating {
                  date
                  class
                  helpfulRating
                  clarityRating
                  isForOnlineClass
                }
                
                fragment RatingSuperHeader_rating on Rating {
                  legacyId
                }
                
                fragment RatingValues_rating on Rating {
                  helpfulRating
                  clarityRating
                  difficultyRating
                }
                
                fragment CourseMeta_rating on Rating {
                  attendanceMandatory
                  wouldTakeAgain
                  grade
                  textbookUse
                  isForOnlineClass
                  isForCredit
                }
                
                fragment RatingTags_rating on Rating {
                  ratingTags
                }
                
                fragment RatingFooter_rating on Rating {
                  id
                  comment
                  adminReviewedAt
                  flagStatus
                  legacyId
                  thumbsUpTotal
                  thumbsDownTotal
                  thumbs {
                    userId
                    thumbsUp
                    thumbsDown
                    id
                  }
                  teacherNote {
                    id
                  }
                }
                
                fragment ProfessorNoteSection_rating on Rating {
                  teacherNote {
                    ...ProfessorNote_note
                    id
                  }
                  ...ProfessorNoteEditor_rating
                }
                
                fragment ProfessorNote_note on TeacherNotes {
                  comment
                  ...ProfessorNoteHeader_note
                  ...ProfessorNoteFooter_note
                }
                
                fragment ProfessorNoteEditor_rating on Rating {
                  id
                  legacyId
                  class
                  teacherNote {
                    id
                    teacherId
                    comment
                  }
                }
                
                fragment ProfessorNoteHeader_note on TeacherNotes {
                  createdAt
                  updatedAt
                }
                
                fragment ProfessorNoteFooter_note on TeacherNotes {
                  legacyId
                  flagStatus
                }
                
                fragment RateTeacherLink_teacher on Teacher {
                  legacyId
                  numRatings
                  lockStatus
                }
                
                fragment RatingFooter_teacher on Teacher {
                  id
                  legacyId
                  lockStatus
                  isProfCurrentUser
                }
                
                fragment RatingSuperHeader_teacher on Teacher {
                  firstName
                  lastName
                  legacyId
                  school {
                    name
                    id
                  }
                }
                
                fragment ProfessorNoteSection_teacher on Teacher {
                  ...ProfessorNote_teacher
                  ...ProfessorNoteEditor_teacher
                }
                
                fragment ProfessorNote_teacher on Teacher {
                  ...ProfessorNoteHeader_teacher
                  ...ProfessorNoteFooter_teacher
                }
                
                fragment ProfessorNoteEditor_teacher on Teacher {
                  id
                }
                
                fragment ProfessorNoteHeader_teacher on Teacher {
                  lastName
                }
                
                fragment ProfessorNoteFooter_teacher on Teacher {
                  legacyId
                  isProfCurrentUser
                }
                
                fragment RatingValue_teacher on Teacher {
                  avgRating
                  numRatings
                  ...NumRatingsLink_teacher
                }
                
                fragment NameTitle_teacher on Teacher {
                  id
                  firstName
                  lastName
                  department
                  school {
                    legacyId
                    name
                    id
                  }
                  ...TeacherDepartment_teacher
                  ...TeacherBookmark_teacher
                }
                
                fragment TeacherTags_teacher on Teacher {
                  lastName
                  teacherRatingTags {
                    legacyId
                    tagCount
                    tagName
                    id
                  }
                }
                
                fragment NameLink_teacher on Teacher {
                  isProfCurrentUser
                  legacyId
                  lastName
                }
                
                fragment TeacherFeedback_teacher on Teacher {
                  numRatings
                  avgDifficulty
                  wouldTakeAgainPercent
                }
                
                fragment TeacherDepartment_teacher on Teacher {
                  department
                  school {
                    legacyId
                    name
                    id
                  }
                }
                
                fragment TeacherBookmark_teacher on Teacher {
                  id
                  isSaved
                }
                
                fragment NumRatingsLink_teacher on Teacher {
                  numRatings
                  ...RateTeacherLink_teacher
                }
                
                fragment HelpfulRating_teacher on Teacher {
                  ...RatingFooter_teacher
                }
                
                fragment HelpfulRating_rating on Rating {
                  date
                  comment
                  isForOnlineClass
                  class
                  ...RatingFooter_rating
                }`,
                variables: {"id": profID}
            })
        };
        request(options, function (error, response) {
            if (error) reject(error)
            resolve(response.body);
        });
    }))
}

/**
 * Search for schools in rateMyProfessor
 * @param name
 */
function searchSchool(name) {
    return new Promise(((resolve, reject) => {
        const options = {
            'method': 'POST',
            'url': 'https://www.ratemyprofessors.com/graphql',
            'headers': {
                'Authorization': 'Basic dGVzdDp0ZXN0',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `query NewSearchSchoolsQuery(
                  $query: SchoolSearchQuery!
                ) {
                  newSearch {
                    schools(query: $query) {
                      edges {
                        cursor
                        node {
                          id
                          legacyId
                          name
                          city
                          state
                        }
                      }
                      pageInfo {
                        hasNextPage
                        endCursor
                      }
                    }
                  }
                }`,
                variables: {"query":{"text":name}}
            })
        };
        request(options, function (error, response) {
            if (error) reject(error);
            resolve(response.body);
        });
    }))
}


/**
 * Searches RateMyProfessor for a professor
 * @param name
 * @param schoolID <optional>
 */
async function searchProfessors(name, schoolID) {
    return new Promise(((resolve, reject) => {
        const searchObj = {
            query: `query NewSearchTeachersQuery(    
          $query: TeacherSearchQuery!
        ) {
          newSearch {
            teachers(after: "", first: 12, query: $query) {
              edges {
                cursor
                node {
                  id
                  legacyId
                  firstName
                  lastName
                  school {
                    name
                    id
                  }
                  department
                }
              }
            }
          }
        }`,
            variables: {"query":{"text":`${name}`}}
        }
        if (schoolID) searchObj.variables.query.schoolID = schoolID
        const options = {
            'method': 'POST',
            'url': 'https://www.ratemyprofessors.com/graphql',
            'headers': {
                'Authorization': 'Basic dGVzdDp0ZXN0',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchObj)
        };

        request(options, function (error, response) {
            if (error) reject(error);
            resolve(response.body);
        });
    }))
}

module.exports = {
    retrieveProfessor,
    searchProfessors,
    searchSchool
}