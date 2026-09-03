import { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type AgendaStackParamList = {
  AgendaList: undefined;
  EventDetail: { eventId: string };
};

export type FavoritesStackParamList = {
  FavoritesList: undefined;
  EventDetail: { eventId: string };
};

export type MapStackParamList = {
  MapView: { focusEventId?: string } | undefined;
  EventDetail: { eventId: string };
};

export type RootTabParamList = {
  Agenda: NavigatorScreenParams<AgendaStackParamList>;
  Favoritos: NavigatorScreenParams<FavoritesStackParamList>;
  Mapa: NavigatorScreenParams<MapStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}
