import { database } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, Timestamp, updateDoc, arrayUnion, collection, getDocs } from 'firebase/firestore';

export function addUserToCollection(uid, username, email) {
    return setDoc(doc(database, "users", uid), {
        username: username,
        email: email,
    });
};



export async function addWorkoutToDocument(user, data, isPrivate) {
    let subcollectionName = isPrivate ? "Private Workouts" : "Public Workouts";
    const messageRef = doc(database, "users", user.uid, subcollectionName, data.workoutName);

    const name = await getUsername(user);
    const randomId = makeid(20);
    const currentTime = Timestamp.now();
    addWorkoutToMain(name, data.workoutName, randomId, isPrivate, currentTime, data.exercises);
    return setDoc(messageRef, {
        creator: name,
        workoutName: data.workoutName,
        workoutId: randomId,
        isPrivate: isPrivate,
        createdAt: currentTime,
        favorite: false,
        workoutExercises: [...data.exercises],
    });
}

export function addWorkoutToMain(uid, workoutName, randomId, isPrivate, currentTime, exercises) {
    return setDoc(doc(database, "workouts", randomId), {
        creator: uid,
        workoutName: workoutName,
        workoutId: randomId,
        isPrivate: isPrivate,
        createdAt: currentTime,
        favorite: false,
        workoutExercises: [...exercises],
    });
}

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

export async function getUsername(user) {
    const docRef = doc(database, "users", user.uid)
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data().username;
    }
}

// Delete workout from user's collection
export async function deleteWorkoutFromCollecton(user, workoutName, isPrivate) {
    try {
        // Delete workout from user's (private or public) collection
        let subcollectionName = isPrivate ? "Private Workouts" : "Public Workouts";
        const userCollectionRef = doc(database, "users", user.uid, subcollectionName, workoutName);
        await deleteDoc(userCollectionRef);
        // Delete workout from main collection
        const mainCollectionRef = doc(database, "workouts", workoutName);
        await deleteDoc(mainCollectionRef);
        return true;
    } catch (error) {
        console.error("Error deleting workout: ", error);
        return false;
    }
}


export async function updateFavoriteWorkout(user, workoutName, isPrivate, favoriteValue) {
    let subcollectionName = isPrivate ? "Private Workouts" : "Public Workouts";
    const ref = doc(database, "users", user.uid, subcollectionName, workoutName);
    try {
        console.log("Updating favorite: ", favoriteValue);
        await updateDoc(ref, {
            favorite: favoriteValue,
        });
        return true;
    } catch (error) {
        console.error("Error updating favorite: ", error);
        return false;
    }
}

export async function addFavoriteWorkoutToUserDocument(user, workoutId) {
    const ref = doc(database, "users", user.uid);
    try {
        await updateDoc(ref, {
            favoritedWorkouts: arrayUnion(workoutId),
        });
        return true;
    } catch (error) {
        console.error("Error updating favorite: ", error);
        return false;
    }
}

export async function getUserFavoritedWorkouts(user) {
    const workoutsRef = collection(database, 'workouts')
    const favoritedWorkouts = user.favorites || []
    const workoutDocs = await getDocs(workoutsRef)
    const workouts = workoutDocs.docs.map((doc) => {
      const workout = doc.data()
      return { ...workout, id: doc.id }
    })
    const favoritedWorkoutData = workouts.filter((workout) => favoritedWorkouts.includes(workout.id))
    return favoritedWorkoutData
  }
  