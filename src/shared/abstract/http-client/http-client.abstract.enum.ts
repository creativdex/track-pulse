export enum EContentType {
  JSON = 'application/json',
  FORM_DATA = 'multipart/form-data',
  FORM_URLENCODED = 'application/x-www-form-urlencoded',
  TEXT = 'text/plain',
  XML = 'application/xml',
  PDF = 'application/pdf',
  OCTET_STREAM = 'application/octet-stream',
}

export enum EHttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
  PURGE = 'PURGE',
  LINK = 'LINK',
  UNLINK = 'UNLINK',
}
