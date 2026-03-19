import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  Platform,
  PermissionsAndroid,
  TouchableOpacity,
  Image,
} from "react-native";
import Contacts, { Contact } from "react-native-contacts";

import { ScreenProps } from "../../interfaces/commonInterfaces";
import colors from "../../config/appStyling/colors";
import Matrics from "../../config/appStyling/matrics";
import typography from "../../config/appStyling/typography";
import FontsSize from "../../config/appStyling/fontsSize";
import { toastMessageError } from "../../components/common/ToastMessage";
import Images from "../../config/Images";
import useTranslation from "../../hooks/useTranslation";
import { APP } from "../../constants/commonConstant";

type ContactRow = {
  id: string;
  name: string;
  phone: string;
};

const normalizePhone = (phone: string) => phone.replace(/\s+/g, " ").trim();
const phoneDigits = (value: string) => value.replace(/\D+/g, "");

const ContactListing: React.FC<ScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState<boolean>(true);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const requestPermission = useCallback(async () => {
    if (Platform.OS !== APP.ANDROID) return true;

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      {
        title: t("contacts.permission_title"),
        message: t("contacts.permission_message"),
        buttonPositive: t("common.accept"),
        buttonNegative: t("common.deny"),
      }
    );

    return status === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const handleContactsData = useCallback((contacts: Contact[]): ContactRow[] => {
    return contacts
      .map((c) => {
        const phone = c.phoneNumbers?.[0]?.number;
        if (!phone) return null;

        const name =
          c.displayName || `${c.givenName ?? ""} ${c.familyName ?? ""}`.trim();

        return {
          id: c.recordID || `${name}-${phone}`,
          name,
          phone: normalizePhone(phone),
        };
      })
      .filter((x): x is ContactRow => Boolean(x))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoading(true);

    try {
      const granted = await requestPermission();
      if (!granted) {
        toastMessageError(t("contacts.permission_denied"));
        setContacts([]);
        return;
      }

      const contacts = await Contacts.getAll();
      if (!contacts) {
        setContacts([]);
        return;
      }

      setContacts(handleContactsData(contacts));
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [requestPermission, handleContactsData]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return contacts;

    const queryLower = query.toLowerCase();
    const queryDigits = phoneDigits(query);

    return contacts.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(queryLower);
      const phoneMatch = queryDigits
        ? phoneDigits(c.phone).includes(queryDigits)
        : false;
      return nameMatch || phoneMatch;
    });
  }, [contacts, searchQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>

          <Image
            source={Images.BACK_ICON}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.title}>{t("contacts.contacts")}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("friends.add_friend.search")}
          placeholderTextColor={"rgba(0,0,0,0.45)"}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      ) : contacts.length === 0 ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t("contacts.no_contacts")}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{t("contacts.no_contacts")}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.phone}>{item.phone}</Text>
              </View>

              <TouchableOpacity
                style={styles.inviteBtn}
                onPress={() => {
                  navigation.navigate("FriendsMain", { selectedPhone: item.phone } as never);
                }}
              >
                <Text style={styles.inviteText}>{t("contacts.select")}</Text>
              </TouchableOpacity>
              
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
    padding: Matrics.s(16),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Matrics.vs(12),
  },
  searchContainer: {
    marginBottom: Matrics.vs(12),
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    borderRadius: Matrics.s(12),
    paddingHorizontal: Matrics.s(12),
    paddingVertical: Platform.OS === APP.IOS ? Matrics.vs(10) : Matrics.vs(8),
    color: colors.TEXT_PRIMARY,
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Satoshi.Regular,
  },
  backBtn: {
    width: Matrics.s(60),
  },
  backText: {
    color: colors.PRIMARY,
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
  },
  title: {
    fontSize: FontsSize.Large,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_DARK,
    lineHeight: Matrics.vs(22),
  },
  errorText: {
    fontSize: FontsSize.Large,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
    color: colors.TEXT_PRIMARY,
    marginBottom: Matrics.vs(8),
    textAlign: "center",
  },
  listContent: {
    paddingBottom: Matrics.vs(24),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Matrics.vs(12),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  rowText: {
    flex: 1,
    paddingRight: Matrics.s(12),
  },
  name: {
    color: colors.TEXT_PRIMARY,
    fontSize: FontsSize.Regular,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
  },
  phone: {
    color: "rgba(0,0,0,0.55)",
    marginTop: Matrics.vs(4),
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Satoshi.Regular,
  },
  inviteBtn: {
    backgroundColor: colors.PRIMARY,
    paddingHorizontal: Matrics.s(14),
    paddingVertical: Matrics.vs(10),
    borderRadius: Matrics.s(18),
  },
  inviteText: {
    color: colors.WHITE,
    fontSize: FontsSize.Small,
    fontFamily: typography.fontFamily.Poppins.SemiBold,
    fontWeight: "600",
  },
  backIcon: {
    width: Matrics.s(24),
    height: Matrics.vs(22),
    tintColor: colors.TEXT_PRIMARY,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
   errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: Matrics.vs(100),
    },
});

export default ContactListing;
