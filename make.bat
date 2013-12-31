set OUTPUT_FILE=WME_Speed.user.js

type WME_Speed.header.user.js > %OUTPUT_FILE%

echo //  >> %OUTPUT_FILE%
echo // CLASS DEFINITIONS FILE  >> %OUTPUT_FILE%
echo //  >> %OUTPUT_FILE%
type WME_Speed.classdefn.user.js >> %OUTPUT_FILE%

echo //  >> %OUTPUT_FILE%
echo // UTILITY DEFINITIONS FILE  >> %OUTPUT_FILE%
echo //  >> %OUTPUT_FILE%
type WME_Speed.util.user.js >> %OUTPUT_FILE%

echo //  >> %OUTPUT_FILE%
echo // COMPONENT SELECTION CLASS  >> %OUTPUT_FILE%
echo //  >> %OUTPUT_FILE%
type WME_Speed.componentselect.user.js >> %OUTPUT_FILE%

echo //  >> %OUTPUT_FILE%
echo // USER SELECTIONS DEFINITIONS FILE  >> %OUTPUT_FILE%
echo //  >> %OUTPUT_FILE%
type WME_Speed.selections.user.js >> %OUTPUT_FILE%

echo //  >> %OUTPUT_FILE%
echo // POPUP DIALOG  >> %OUTPUT_FILE%
echo //  >> %OUTPUT_FILE%
type WME_Speed.popup.user.js >> %OUTPUT_FILE%

echo //  >> %OUTPUT_FILE%
echo // CORE FILE  >> %OUTPUT_FILE%
echo //  >> %OUTPUT_FILE%
type WME_Speed.core.user.js >> %OUTPUT_FILE%
