import { DocumentReference } from "firebase-admin/firestore";
import { db } from "src/config/firebase";
import { COLLECTIONS } from "src/enum/firestore.enum";

export function idToDocumentRef(id: string, collection: COLLECTIONS): DocumentReference {
  return db.collection(collection).doc(id);
}