/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/forgot-password` | `/(auth)/login` | `/(auth)/register` | `/(auth)/reset-password` | `/(auth)/verify-otp` | `/(tabs)` | `/(tabs)/` | `/(tabs)/my-courses` | `/(tabs)/profile` | `/_sitemap` | `/change-password` | `/demo-lectures` | `/forgot-password` | `/login` | `/my-courses` | `/profile` | `/register` | `/reset-password` | `/search` | `/trending` | `/verify-otp`;
      DynamicRoutes: `/course/${Router.SingleRoutePart<T>}` | `/semesters/${Router.SingleRoutePart<T>}` | `/subjects/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/course/[subjectId]` | `/semesters/[branchId]` | `/subjects/[semesterId]`;
    }
  }
}
