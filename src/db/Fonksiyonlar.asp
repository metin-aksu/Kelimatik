<%

Function Baglan

	Set Conn1 = Server.CreateObject("ADODB.Connection")

	Conn1.Open "Provider=Microsoft.ACE.OLEDB.12.0; Data Source=" & Server.MapPath("Kelimeler.mdb") & ";"

	'If Request.ServerVariables("SERVER_NAME") = "127.0.0.1" or Request.ServerVariables("SERVER_NAME") = "localhost" Then

		'Conn1.Open "DRIVER=SQLite3 ODBC Driver;Database="& Server.Mappath("Kelimeler.db") &";LongNames=0;Timeout=1000;NoTXN=0;SyncPragma=NORMAL;StepAPI=0;"
		'Conn1.Open "DRIVER={MySQL ODBC 3.51 Driver};server=localhost;port=3307;uid=root;pwd=1648;database=kelimatik;"
		'Conn1.Execute "SET NAMES 'latin5'"
		'Conn1.Execute "SET CHARACTER SET latin5"
		'Conn1.Execute "SET COLLATION_CONNECTION = 'latin5_turkish_ci'"
	'Else
		'Conn1.Open "DRIVER=SQLite3 ODBC Driver;Database="& Server.Mappath("../db/Kelimeler.db") &";LongNames=0;Timeout=1000;NoTXN=0;SyncPragma=NORMAL;StepAPI=0;"
	'	Conn1.Open "DRIVER={MySQL ODBC 3.51 Driver};server=94.73.151.228;uid=kelimatik;pwd=kel1648;database=kelimatik;"
	'	Conn1.Execute "SET NAMES 'latin5'"
	'	Conn1.Execute "SET CHARACTER SET latin5"
	'	Conn1.Execute "SET COLLATION_CONNECTION = 'latin5_turkish_ci'"
	'End If

	Set Baglan = Conn1

End Function
'=============================================================================
Sub Listele

	strAlfabe = "abcçdefgðhýijklmnoöprsþtuüvyz"
	strGelenHarfler = Formatla(Request("harfler"))
	intHarfSayisi = Len(strGelenHarfler)
	
	strSQL = ""
	
	For y = 1 To 29
	
		strAlfabeHarfi = Trim(Mid(strAlfabe,y,1))
		
		If Instr(strGelenHarfler,strAlfabeHarfi) < 1 Then

			strSQL = strSQL & " AND kelime Not Like '%"& strAlfabeHarfi &"%' "
		
		End If 
	
	Next

	strSQL = Replace(strSQL,"AND","",1,1,1)

	Set Conn = Baglan

	Set rs = Conn.Execute("SELECT * FROM Kelimeler WHERE "& strSQL &" ORDER BY kelime ASC")

	For x = 2 To intHarfSayisi

		If rs.Eof Then rs.MoveFirst

		Response.Write "<b>" & x & " harf</b> : "
		
		Do While Not rs.Eof

			ListelemeIzni = False

			strKelime = Trim(rs("kelime"))

			If Len(strKelime) = x Then

				ListelemeIzni = KontrolEt(strKelime)

				If ListelemeIzni = True Then Response.Write Lcase(strKelime) & ", "

			End If

		rs.MoveNext
		Loop

		Response.Write "<br><br>"
	
	Next
	
	rs.Close : Set rs = Nothing
	Conn.Close : Set Conn = Nothing	
	
End Sub
'=============================================================================
Sub BaslayanBitenGecenListele

	If Request("eylem") = "baslayan"  Then
		strBaslayan = Formatla(Request("baslayan"))
		strSQL = "SELECT * FROM Kelimeler WHERE kelime LIKE '"& strBaslayan &"%' ORDER BY boyut ASC, kelime ASC"
	ElseIf Request("eylem") = "biten" Then
		strBiten = Formatla(Request("biten"))
		strSQL = "SELECT * FROM Kelimeler WHERE kelime LIKE '%"& strBiten &"' ORDER BY boyut ASC, kelime ASC"
	ElseIf Request("eylem") = "gecen" Then
		strGecen = Formatla(Request("gecen"))
		strSQL = "SELECT * FROM Kelimeler WHERE kelime LIKE '%"& strGecen &"%' ORDER BY boyut ASC, kelime ASC"
	End If 	

	Set Conn = Baglan
	Set rsKelimeler = Conn.Execute(strSQL)
	Do While Not rsKelimeler.Eof

		intBoyut = rsKelimeler("boyut")

		If intBoyut <> intBoyut2 Then
			Response.Write "<br><br><b>" & intBoyut & " harf</b> : "
		End If 

		Response.Write rsKelimeler("kelime") & ", "

		intBoyut2 = rsKelimeler("boyut")

	rsKelimeler.MoveNext : Loop	
	rsKelimeler.Close : Set rsKelimeler = Nothing
	Conn.Close : Set Conn = Nothing		
End Sub
'=============================================================================
Function KontrolEt(strKelime)

	strHarfler = Formatla(Request("harfler"))

	strKelime = Formatla(strKelime)

	KontrolDurumu = False	

	For y = 1 To Len(strKelime)

		KontrolDurumu = False

		strKelimeninHarfi = Mid(strKelime,y,1)

		For z = 1 To Len(strHarfler)

			strGelenHarf = CStr(Mid(strHarfler,z,1))

			If CStr(strKelimeninHarfi) = CStr(strGelenHarf) Then

				KontrolDurumu = True

				strHarfler = Replace(strHarfler,strGelenHarf,"-",1,1,1)

				Exit For

			End if

		Next

		If KontrolDurumu = False Then Exit For

	Next

	KontrolEt = KontrolDurumu

End Function
'=============================================================================
Function Formatla(strGelenVeri)

	If strGelenVeri <> "" Then
		strGelenVeri = Replace(Trim(strGelenVeri)," ","")
		strGelenVeri = Replace(strGelenVeri,"Ý","i")
		strGelenVeri = Replace(strGelenVeri,"I","ý")
		strGelenVeri = Replace(strGelenVeri,"Ö","ö")
		strGelenVeri = Replace(strGelenVeri,"Ü","ü")
		strGelenVeri = Replace(strGelenVeri,"Ð","ð")
		strGelenVeri = Replace(strGelenVeri,"Ç","ç")
		strGelenVeri = Replace(strGelenVeri,"Þ","þ")
		strGelenVeri = Replace(strGelenVeri ,"<","")
		strGelenVeri = Replace(strGelenVeri ,">","")
		strGelenVeri = Replace(strGelenVeri ,"--","")
		strGelenVeri = Replace(strGelenVeri ," and ","",1,-1,1)
		strGelenVeri = Replace(strGelenVeri ," or ","",1,-1,1)
		strGelenVeri = LCase(strGelenVeri)

		Formatla = strGelenVeri
	Else
		Formatla = ""
	End If 

End Function 
'=============================================================================
Sub BoyutGir

	Set Conn = Baglan

	Set rs = Conn.Execute("SELECT * FROM Kelimeler")

	Do While Not rs.Eof

		If rs("boyut") <> "" Then

		Else

			boyut = Len(rs("kelime"))

			Conn.Execute("UPDATE Kelimeler SET boyut = "& boyut &" WHERE kelime = '"& rs("kelime") &"' ")
		End If 

		

	rs.MoveNext : Loop	
	rs.Close : Set rs = Nothing
	Conn.Close : Set Conn = Nothing	

	Response.Write "boyutlandýrma iþlemi bitti"

End Sub
'=============================================================================
Sub YeniTablo

	Set Conn = Baglan

	Set rs = Conn.Execute("SELECT * FROM Kelimeler ORDER BY kelime ASC")

	Do While Not rs.Eof

		kelime = Trim(rs("kelime"))
		boyut = Len(kelime)

		Conn.Execute("INSERT INTO Kelimeler2(kelime,boyut) VALUES('"& kelime &"',"& boyut &")")

	rs.MoveNext : Loop	
	rs.Close : Set rs = Nothing
	Conn.Close : Set Conn = Nothing	

	Response.Write "yeni tablo oluþturuldu"

End Sub
%>