// Redux tool kit
import { configureStore } from '@reduxjs/toolkit'
import { userReducer } from './user/userSlice'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage for web
import { combineReducers } from 'redux'

const rootPersistConfig = {
  key: 'root', // key for the persisted data name by us, just let it be 'root'
  storage: storage,
  whitelist: ['user'], // which reducer want to store after refresh (F5), need to be the same name as in combineReducers
  // blacklist: ['activeBoard'], // which reducer don't want to store after refresh (F5)
}

const reducers = combineReducers({
  user: userReducer,

  //... add more reducers here later if needed
})

const persistedReducer = persistReducer(rootPersistConfig, reducers)

export const store = configureStore({
  reducer: persistedReducer,
  // fix warning message in console about non-serializable values in redux state
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
})
