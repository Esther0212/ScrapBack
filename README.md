````markdown
# PLEASE

---

## ✅ 1. File Naming Convention

Use **camelCase** for all filenames (especially in the `/app` and `/components` folders) to keep consistency and avoid confusion.

✅ Good:
```sh
loginScreen.js
customTabBar.js
````

❌ Bad:

```sh
LoginScreen.js
custom_tab_bar.js
CustomTabBar.js
```

---

## ✅ 2. Always Use `SafeAreaView`

To prevent layout issues (e.g., overlapping with the status bar on devices like iPhone X), **wrap all page content** inside a `SafeAreaView` (and `SafeAreaProvider` if needed):

### Installation:

```js
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
```

### Usage:

```js
<SafeAreaProvider>
  <SafeAreaView style={styles.SafeAreaView}>
    {/* Your screen content here */}
  </SafeAreaView>
</SafeAreaProvider>
```

### Style Example:

```js
const styles = StyleSheet.create({
  SafeAreaView: {
    flex: 1,
  },
});
```

📖 Reference:
[React Native and iPhone X SafeAreaView (bram.us)](https://www.bram.us/2018/02/20/react-native-and-iphone-x-safeareaview/)

---

## ✅ 3. Component Export Format

Always use the following pattern when creating functional components:

```js
const Layout = () => {
  // your component code here
};

export default Layout;
```

❌ Avoid directly exporting anonymous functions like this:

```js
export default () => {
  return <View />;
};
```

This improves component reusability and naming in error stacks and dev tools.

---

## ✅ 4. Custom Background Wrapper

We have a `CustomBgColor` wrapper component located at:

```
/src/components/customBgColor.js
```

Wrap your pages with this component to apply consistent background styling.

```js
<CustomBgColor>
  {/* Page content */}
</CustomBgColor>
```

---

## ✅ 5. Icon Management via Centralized Import

Instead of importing individual icons on each page like:

```js
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
```

✅ **Use the centralized icon handler** in `/components/Icons.js`:

```js
import { Icons } from "../components/Icons";

const Icon = Icons.MaterialCommunityIcons;

<Icon name="account-circle-outline" size={30} color="#008243" />
```

### `Icons.js` Sample:

```js
// src/components/Icons.js
import { AntDesign } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
// Add more as needed...

export const Icons = {
  AntDesign,
  MaterialCommunityIcons,
  Feather,
};
```

---

## 🧪 Sample Login Screen

```js
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomBgColor from "../components/customBgColor";
import { router } from "expo-router";
import { Icons } from "../components/Icons";

const Login = () => {
  const Icon = Icons.MaterialCommunityIcons;

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.SafeAreaView}>
        <View style={styles.container}>
          <Icon name="account-circle-outline" size={50} color="#008243" />
          <Text>Welcome to the Login Page!</Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.buttonText}>Go to Signup</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </CustomBgColor>
  );
};

const styles = StyleSheet.create({
  SafeAreaView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    marginTop: 20,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "#008243",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
});

export default Login;
```

---

